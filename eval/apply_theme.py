"""Apply TeachPlay theme (UA Crimson + Inter + branded header/footer + progress bar)
to both survey shells. Idempotent — safe to re-run.

Usage:
    python apply_theme.py
"""
import json
from pathlib import Path

import qualtrics_helper as qh

SURVEYS = {
    "post": ("SV_39sdRK7OVJvSiPk", "TeachPlay — Post-Program Survey"),
    "pre":  ("SV_9QtpyWbqTypaFls", "TeachPlay — Pre-Program Survey"),
}


def main():
    c = qh.Qualtrics()
    me = c.whoami()
    print(f"Authenticated as {me['userName']}.\n")

    for role, (sv_id, title) in SURVEYS.items():
        # PUT is full-replace, not partial — fetch current then merge
        current = c._req("GET", f"/survey-definitions/{sv_id}/options")["result"]
        merged = {**current, **qh.teachplay_theme_options(survey_title=title)}
        result = c._req(
            "PUT", f"/survey-definitions/{sv_id}/options", json=merged
        )
        meta = result.get("meta", {})
        print(f"  {role:5s}  {sv_id}  -> httpStatus={meta.get('httpStatus', '?')}")

    print("\nVerifying applied options...")
    for role, (sv_id, _) in SURVEYS.items():
        cur = c._req("GET", f"/survey-definitions/{sv_id}/options")["result"]
        print(
            f"  {role:5s}  ProgressBar={cur['ProgressBarDisplay']:<12s} "
            f"BackButton={cur['BackButton']:<5s} "
            f"BallotBox={cur['BallotBoxStuffingPrevention']:<5s} "
            f"Header={'set' if cur['Header'] else 'empty':<5s} "
            f"Title=\"{cur['SurveyTitle'][:40]}\""
        )


if __name__ == "__main__":
    main()
