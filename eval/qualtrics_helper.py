"""Qualtrics v3 REST helper for TeachPlay evaluation surveys.

Token + datacenter loaded from C:\\Users\\jewoo\\Desktop\\qualtrics-token.txt
(tab-separated key/value rows; line `Token<TAB><value>` carries the token).
Datacenter `pdx1` per UA Qualtrics IDs page; brand `universityofalabama`.

Surveys are created with isActive=false. Activation is a separate explicit call
because activation has IRB / distribution implications.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import requests

DEFAULT_TOKEN_FILE = Path(r"C:\Users\jewoo\Desktop\qualtrics-token.txt")
DEFAULT_DATACENTER = "pdx1"


def load_token(path: Path = DEFAULT_TOKEN_FILE) -> str:
    text = Path(path).read_text(encoding="utf-8", errors="ignore")
    for line in text.splitlines():
        if re.match(r"^Token\s", line):
            return line.split(maxsplit=1)[1].strip()
    raise RuntimeError(f"No Token line found in {path}")


class Qualtrics:
    def __init__(self, token: str | None = None, datacenter: str = DEFAULT_DATACENTER):
        self.token = token or load_token()
        self.base = f"https://{datacenter}.qualtrics.com/API/v3"
        self.headers = {"X-API-TOKEN": self.token, "Content-Type": "application/json"}

    def _req(self, method: str, path: str, **kw: Any) -> dict:
        url = f"{self.base}{path}"
        r = requests.request(method, url, headers=self.headers, timeout=30, **kw)
        try:
            data = r.json()
        except ValueError:
            r.raise_for_status()
            return {"raw": r.text}
        if r.status_code >= 400:
            raise RuntimeError(f"{method} {path} -> {r.status_code}: {json.dumps(data)[:600]}")
        return data

    def whoami(self) -> dict:
        return self._req("GET", "/whoami")["result"]

    def create_survey(
        self, name: str, language: str = "EN", project_category: str = "CORE"
    ) -> dict:
        body = {"SurveyName": name, "Language": language, "ProjectCategory": project_category}
        return self._req("POST", "/survey-definitions", json=body)["result"]

    def add_block(
        self, survey_id: str, description: str, block_type: str = "Standard"
    ) -> str:
        body = {"Type": block_type, "Description": description, "BlockElements": []}
        result = self._req(
            "POST", f"/survey-definitions/{survey_id}/blocks", json=body
        )["result"]
        return result["BlockID"]

    def add_question(self, survey_id: str, payload: dict, block_id: str | None = None) -> str:
        params = {"blockId": block_id} if block_id else None
        result = self._req(
            "POST",
            f"/survey-definitions/{survey_id}/questions",
            params=params,
            json=payload,
        )["result"]
        return result["QuestionID"]

    def get_survey(self, survey_id: str) -> dict:
        return self._req("GET", f"/survey-definitions/{survey_id}")["result"]

    def set_flow(self, survey_id: str, flow: dict) -> dict:
        return self._req("PUT", f"/survey-definitions/{survey_id}/flow", json=flow)

    def set_active(self, survey_id: str, active: bool) -> dict:
        return self._req("PUT", f"/surveys/{survey_id}", json={"isActive": active})


# ---------- Question payload builders --------------------------------------
# Selectors per Qualtrics v3 API reference (api.qualtrics.com).

LIKERT_5_AGREE = {
    "1": {"Display": "Strongly disagree"},
    "2": {"Display": "Disagree"},
    "3": {"Display": "Neither agree nor disagree"},
    "4": {"Display": "Agree"},
    "5": {"Display": "Strongly agree"},
}

LIKERT_5_CONFIDENCE = {
    "1": {"Display": "Not at all confident"},
    "2": {"Display": "Slightly confident"},
    "3": {"Display": "Moderately confident"},
    "4": {"Display": "Confident"},
    "5": {"Display": "Very confident"},
}


def _validation(force: bool) -> dict:
    return {"Settings": {"ForceResponse": "ON" if force else "OFF", "Type": "None"}}


def likert_agree(text: str, tag: str, force: bool = True) -> dict:
    """5-point Strongly disagree..Strongly agree (single MC vertical)."""
    return {
        "QuestionText": text,
        "DataExportTag": tag,
        "QuestionType": "MC",
        "Selector": "SAVR",
        "SubSelector": "TX",
        "Configuration": {"QuestionDescriptionOption": "UseText"},
        "QuestionDescription": tag,
        "Choices": LIKERT_5_AGREE,
        "ChoiceOrder": ["1", "2", "3", "4", "5"],
        "Validation": _validation(force),
        "Language": [],
    }


def likert_confidence(text: str, tag: str, force: bool = True) -> dict:
    return {
        "QuestionText": text,
        "DataExportTag": tag,
        "QuestionType": "MC",
        "Selector": "SAVR",
        "SubSelector": "TX",
        "Configuration": {"QuestionDescriptionOption": "UseText"},
        "QuestionDescription": tag,
        "Choices": LIKERT_5_CONFIDENCE,
        "ChoiceOrder": ["1", "2", "3", "4", "5"],
        "Validation": _validation(force),
        "Language": [],
    }


def mc_single(
    text: str, tag: str, choices: list[str], force: bool = True
) -> dict:
    """Single-answer multiple choice (vertical radio)."""
    choice_map = {str(i + 1): {"Display": c} for i, c in enumerate(choices)}
    return {
        "QuestionText": text,
        "DataExportTag": tag,
        "QuestionType": "MC",
        "Selector": "SAVR",
        "SubSelector": "TX",
        "Configuration": {"QuestionDescriptionOption": "UseText"},
        "QuestionDescription": tag,
        "Choices": choice_map,
        "ChoiceOrder": [str(i + 1) for i in range(len(choices))],
        "Validation": _validation(force),
        "Language": [],
    }


def mc_multi(
    text: str, tag: str, choices: list[str], force: bool = False
) -> dict:
    """Multi-select (check all)."""
    choice_map = {str(i + 1): {"Display": c} for i, c in enumerate(choices)}
    return {
        "QuestionText": text,
        "DataExportTag": tag,
        "QuestionType": "MC",
        "Selector": "MAVR",
        "SubSelector": "TX",
        "Configuration": {"QuestionDescriptionOption": "UseText"},
        "QuestionDescription": tag,
        "Choices": choice_map,
        "ChoiceOrder": [str(i + 1) for i in range(len(choices))],
        "Validation": _validation(force),
        "Language": [],
    }


def text_entry(text: str, tag: str, force: bool = False, multiline: bool = False) -> dict:
    return {
        "QuestionText": text,
        "DataExportTag": tag,
        "QuestionType": "TE",
        "Selector": "ML" if multiline else "SL",
        "Configuration": {"QuestionDescriptionOption": "UseText"},
        "QuestionDescription": tag,
        "Validation": _validation(force),
    }


def teachplay_theme_options(survey_title: str = "TeachPlay — Program Evaluation Survey") -> dict:
    """Survey-level options payload for `PUT /survey-definitions/{id}/options`.

    Layered on top of the UA brand skin (`SkinLibrary: universityofalabama`,
    auto-applied). Adds UA Crimson (#9E1B32), Inter typography, sticky brand
    header, IRB-aware footer, verbose progress bar, back button, save-and-continue.
    """
    css = (
        "<style>"
        "body, .Skin { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "
        "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif !important; }"
        ".QuestionText { font-size: 16px !important; line-height: 1.55 !important; "
        "color: #2c2a29 !important; font-weight: 500 !important; }"
        ".QuestionBody { font-size: 15px !important; }"
        ".Skin .ButtonNext, .Skin .ButtonSubmit, "
        ".Skin input[type=submit], .Skin button[type=submit] {"
        " background: #9E1B32 !important; border-color: #9E1B32 !important; "
        " color: #ffffff !important; border-radius: 4px !important; "
        " font-weight: 600 !important; letter-spacing: 0.02em !important; "
        " padding: 10px 22px !important; box-shadow: none !important; }"
        ".Skin .ButtonNext:hover, .Skin .ButtonSubmit:hover { "
        " background: #7a0e1f !important; border-color: #7a0e1f !important; }"
        ".Skin .ProgressBarFill, .progress-bar-fill { background: #9E1B32 !important; }"
        ".Skin .QuestionOuter.row { padding: 14px 0 !important; }"
        ".Skin .QuestionOuter:hover { background: #fbf7f8 !important; }"
        ".Skin a { color: #9E1B32 !important; }"
        ".Skin .Separator { border-color: #ebe5e0 !important; }"
        "</style>"
    )
    header_html = (
        css
        + "<div style=\"max-width: 720px; margin: 0 auto 18px; "
          "border-left: 4px solid #9E1B32; padding: 8px 0 8px 14px;\">"
          "<div style=\"font-size: 11px; font-weight: 700; letter-spacing: 0.12em; "
          "text-transform: uppercase; color: #9E1B32;\">TeachPlay</div>"
          "<div style=\"font-size: 14px; color: #555; margin-top: 2px;\">"
          "AI-Enhanced Educational Game Design &middot; "
          "University of Alabama, College of Education</div>"
          "</div>"
    )
    footer_html = (
        "<div style=\"max-width: 720px; margin: 18px auto 0; font-size: 11px; "
        "color: #888; padding-top: 10px; border-top: 1px solid #ebe5e0; "
        "line-height: 1.5;\">"
        "Anonymous research instrument &middot; No personally identifying "
        "information collected &middot; Data stored on UA-approved Qualtrics "
        "servers &middot; UA IRB protocol HRP-503a (TeachPlay)."
        "</div>"
    )
    return {
        "BackButton": "true",
        "SaveAndContinue": "true",
        "BallotBoxStuffingPrevention": "true",
        "NoIndex": "Yes",
        "SecureResponseFiles": "true",
        "ProgressBarDisplay": "VerboseText",
        "Header": header_html,
        "Footer": footer_html,
        "SurveyTitle": survey_title,
        "SurveyMetaDescription": (
            "TeachPlay program evaluation survey — University of Alabama, "
            "College of Education. Anonymous research instrument."
        ),
    }


def numeric_entry(text: str, tag: str, force: bool = False) -> dict:
    return {
        "QuestionText": text,
        "DataExportTag": tag,
        "QuestionType": "TE",
        "Selector": "SL",
        "Configuration": {"QuestionDescriptionOption": "UseText"},
        "QuestionDescription": tag,
        "Validation": {"Settings": {"ForceResponse": "ON" if force else "OFF",
                                     "Type": "ValidNumber",
                                     "ValidNumber": {"Min": "0", "Max": "999"}}},
    }
