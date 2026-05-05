"""Build TeachPlay Pre/Post Qualtrics surveys (isActive=false on create).

Usage:
    python build_surveys.py post     # creates Post-Program 22-item shell
    python build_surveys.py pre      # creates Pre-Program 20-item shell
    python build_surveys.py both     # creates both
    python build_surveys.py verify <surveyId>   # GET + summary

Created surveys are NEVER auto-activated. Activation is a separate
explicit call on the Qualtrics UI (or qualtrics_helper.set_active),
because activation has IRB / distribution implications.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import qualtrics_helper as qh
from instruments import (
    AI_SE,
    CRED_EXPECT,
    CRED_VALUE,
    DEMOGRAPHICS,
    DESIGNER_ID,
    MATCHING_CODE_INSTRUCTION,
    TAG_ITEMS_POST,
    TSE_CONTAGION,
    UMUX,
)


# ---------- Helpers --------------------------------------------------------
BUILDER_MAP = {
    "text_entry": qh.text_entry,
    "numeric_entry": qh.numeric_entry,
    "mc_single": qh.mc_single,
    "mc_multi": qh.mc_multi,
}


def add_likert_block(
    client: qh.Qualtrics,
    survey_id: str,
    block_id: str,
    items: list[tuple[str, str]],
    likert_kind: str,
) -> int:
    builder = qh.likert_agree if likert_kind == "agree" else qh.likert_confidence
    n = 0
    for text, tag in items:
        client.add_question(survey_id, builder(text, tag, force=True), block_id=block_id)
        n += 1
    return n


def add_dynamic_block(
    client: qh.Qualtrics, survey_id: str, block_id: str, items: list[tuple]
) -> int:
    """For TAG_ITEMS_POST and DEMOGRAPHICS — each row carries its own builder name."""
    n = 0
    for row in items:
        kind = row[0]
        if kind in ("text_entry", "numeric_entry"):
            text, tag, force = row[1], row[2], row[3]
            payload = BUILDER_MAP[kind](text, tag, force=force)
        elif kind in ("mc_single", "mc_multi"):
            text, tag, choices, force = row[1], row[2], row[3], row[4]
            payload = BUILDER_MAP[kind](text, tag, choices, force=force)
        else:
            raise ValueError(f"Unknown builder kind: {kind}")
        client.add_question(survey_id, payload, block_id=block_id)
        n += 1
    return n


# ---------- Survey flow with EmbeddedData (cohort) -------------------------
def cohort_flow(survey_id: str, default_block_id: str, extra_block_ids: list[str]) -> dict:
    """Survey Flow with EmbeddedData declaring `cohort` as URL param.

    Anonymous link form: ?cohort=2026-spring  → captured into responses.
    """
    flow_elements = [
        {
            "Type": "EmbeddedData",
            "FlowID": "FL_ED",
            "EmbeddedData": [
                {"Description": "cohort", "Type": "Recipient",
                 "Field": "cohort", "VariableType": "String",
                 "DataVisibility": [], "AnalyzeText": False},
            ],
        },
        {"Type": "Block", "ID": default_block_id, "FlowID": "FL_BLK_0"},
    ]
    for i, bid in enumerate(extra_block_ids, start=1):
        flow_elements.append({"Type": "Block", "ID": bid, "FlowID": f"FL_BLK_{i}"})
    return {
        "Type": "Root",
        "FlowID": "FL_ROOT",
        "Properties": {"Count": len(flow_elements) + 1},
        "Flow": flow_elements,
    }


# ---------- Build POST (22 items) ------------------------------------------
def build_post(client: qh.Qualtrics) -> dict:
    sv = client.create_survey("TeachPlay Post-Program Survey", language="EN")
    survey_id = sv["SurveyID"]
    default_block = sv["DefaultBlockID"]

    # Block 0 — Tag (3 items): T0 match code (with instructions), T1 role, T2 hours actual
    t0_text = MATCHING_CODE_INSTRUCTION + "<p><b>Your 4-character code:</b></p>"
    client.add_question(
        survey_id,
        qh.text_entry(t0_text, "T0_match_code", force=True),
        block_id=default_block,
    )
    add_dynamic_block(client, survey_id, default_block, TAG_ITEMS_POST[1:])  # T1, T2

    # Block 1 — UMUX usability (4)
    b_umux = client.add_block(survey_id, "1_Usability_UMUX")
    add_likert_block(client, survey_id, b_umux, UMUX, "agree")

    # Block 2 — AI-use Self-Efficacy (4)
    b_aise = client.add_block(survey_id, "2_AI_Use_Self_Efficacy")
    add_likert_block(client, survey_id, b_aise, AI_SE, "confidence")

    # Block 3 — Credential value perception (4)
    b_cv = client.add_block(survey_id, "3_Credential_Value_Perception")
    add_likert_block(client, survey_id, b_cv, CRED_VALUE, "agree")

    # Block 4 — Designer identity (4)
    b_di = client.add_block(survey_id, "4_Designer_Identity")
    add_likert_block(client, survey_id, b_di, DESIGNER_ID, "agree")

    # Block 5 — Teaching efficacy contagion (3)
    b_tse = client.add_block(survey_id, "5_Teaching_Efficacy_Contagion")
    add_likert_block(client, survey_id, b_tse, TSE_CONTAGION, "confidence")

    # Survey Flow — declare cohort EmbeddedData + ordered blocks
    client.set_flow(
        survey_id,
        cohort_flow(survey_id, default_block, [b_umux, b_aise, b_cv, b_di, b_tse]),
    )

    return {
        "SurveyID": survey_id,
        "blocks": {
            "0_Tag": default_block,
            "1_Usability_UMUX": b_umux,
            "2_AI_Use_Self_Efficacy": b_aise,
            "3_Credential_Value_Perception": b_cv,
            "4_Designer_Identity": b_di,
            "5_Teaching_Efficacy_Contagion": b_tse,
        },
        "item_count": 3 + 4 + 4 + 4 + 4 + 3,
    }


# ---------- Build PRE (20 items) ------------------------------------------
def build_pre(client: qh.Qualtrics) -> dict:
    sv = client.create_survey("TeachPlay Pre-Program Survey", language="EN")
    survey_id = sv["SurveyID"]
    default_block = sv["DefaultBlockID"]

    # Block 0 — Tag (1 item): T0 match code only (cohort/role come in Demographics)
    t0_text = MATCHING_CODE_INSTRUCTION + "<p><b>Your 4-character code:</b></p>"
    client.add_question(
        survey_id,
        qh.text_entry(t0_text, "T0_match_code", force=True),
        block_id=default_block,
    )

    # Block 1 — Demographics (7)
    b_demo = client.add_block(survey_id, "1_Demographics")
    add_dynamic_block(client, survey_id, b_demo, DEMOGRAPHICS)

    # Block 2 — AI-use Self-Efficacy baseline (4)
    b_aise = client.add_block(survey_id, "2_AI_Use_Self_Efficacy_Baseline")
    add_likert_block(client, survey_id, b_aise, AI_SE, "confidence")

    # Block 3 — Designer identity baseline (4)
    b_di = client.add_block(survey_id, "3_Designer_Identity_Baseline")
    add_likert_block(client, survey_id, b_di, DESIGNER_ID, "agree")

    # Block 4 — Credential expectation (4)
    b_ce = client.add_block(survey_id, "4_Credential_Expectation")
    add_likert_block(client, survey_id, b_ce, CRED_EXPECT, "agree")

    client.set_flow(
        survey_id,
        cohort_flow(survey_id, default_block, [b_demo, b_aise, b_di, b_ce]),
    )

    return {
        "SurveyID": survey_id,
        "blocks": {
            "0_Tag": default_block,
            "1_Demographics": b_demo,
            "2_AI_Use_Self_Efficacy_Baseline": b_aise,
            "3_Designer_Identity_Baseline": b_di,
            "4_Credential_Expectation": b_ce,
        },
        "item_count": 1 + 7 + 4 + 4 + 4,
    }


def verify(client: qh.Qualtrics, survey_id: str) -> dict:
    s = client.get_survey(survey_id)
    questions = s.get("Questions", {})
    blocks = s.get("Blocks", {})
    return {
        "SurveyName": s.get("SurveyName"),
        "isActive": s.get("SurveyStatus", "Inactive"),
        "block_count": len(blocks),
        "question_count": len(questions),
        "block_descriptions": [b.get("Description") for b in blocks.values()],
        "data_export_tags": [q.get("DataExportTag") for q in questions.values()],
    }


# ---------- Main -----------------------------------------------------------
def main(argv: list[str]) -> None:
    if len(argv) < 2:
        print(__doc__)
        sys.exit(2)

    mode = argv[1]
    client = qh.Qualtrics()
    me = client.whoami()
    print(f"Authenticated as {me['userName']} (brand={me['brandId']}).")

    output_path = Path(__file__).parent / "_created_surveys.json"
    summary: dict = {}

    if mode in ("post", "both"):
        print("Creating POST survey...")
        post = build_post(client)
        summary["post"] = post
        print(json.dumps(post, indent=2))

    if mode in ("pre", "both"):
        print("Creating PRE survey...")
        pre = build_pre(client)
        summary["pre"] = pre
        print(json.dumps(pre, indent=2))

    if mode == "verify":
        if len(argv) < 3:
            print("verify requires <surveyId>")
            sys.exit(2)
        info = verify(client, argv[2])
        print(json.dumps(info, indent=2))
        return

    if summary:
        # Append rather than overwrite — don't lose prior IDs on partial runs
        existing = {}
        if output_path.exists():
            try:
                existing = json.loads(output_path.read_text(encoding="utf-8"))
            except Exception:
                existing = {}
        existing.update(summary)
        output_path.write_text(json.dumps(existing, indent=2), encoding="utf-8")
        print(f"\nWrote {output_path}")


if __name__ == "__main__":
    main(sys.argv)
