"""One-shot resumption for SV_39sdRK7OVJvSiPk where T0+T1 already exist.

Adds T2 (now bucketed MC) + all remaining blocks (Usability, AI-SE, CredValue,
DesignerID, TSEContagion) + flow with cohort EmbeddedData.
"""
import json
import sys
from pathlib import Path

import qualtrics_helper as qh
from build_surveys import (
    add_dynamic_block,
    add_likert_block,
    cohort_flow,
)
from instruments import (
    AI_SE,
    CRED_VALUE,
    DESIGNER_ID,
    TAG_ITEMS_POST,
    TSE_CONTAGION,
    UMUX,
)

SURVEY_ID = "SV_39sdRK7OVJvSiPk"


def main():
    c = qh.Qualtrics()
    me = c.whoami()
    print(f"Authenticated as {me['userName']}.")

    # Find the default block (T0+T1 are in it)
    s = c.get_survey(SURVEY_ID)
    blocks = s.get("Blocks", {})
    default_block = next(iter(blocks.keys()))
    print(f"Default block: {default_block} (description={blocks[default_block].get('Description')})")

    # Add T2 (bucketed mc_single) into default block
    t2 = TAG_ITEMS_POST[2]
    text, tag, choices, force = t2[1], t2[2], t2[3], t2[4]
    c.add_question(SURVEY_ID, qh.mc_single(text, tag, choices, force=force), block_id=default_block)
    print("Added T2_hours_actual.")

    # Block 1 — UMUX (4)
    b_umux = c.add_block(SURVEY_ID, "1_Usability_UMUX")
    add_likert_block(c, SURVEY_ID, b_umux, UMUX, "agree")
    print(f"Block 1 UMUX: {b_umux}")

    # Block 2 — AI-use SE (4)
    b_aise = c.add_block(SURVEY_ID, "2_AI_Use_Self_Efficacy")
    add_likert_block(c, SURVEY_ID, b_aise, AI_SE, "confidence")
    print(f"Block 2 AISE: {b_aise}")

    # Block 3 — Credential value (4)
    b_cv = c.add_block(SURVEY_ID, "3_Credential_Value_Perception")
    add_likert_block(c, SURVEY_ID, b_cv, CRED_VALUE, "agree")
    print(f"Block 3 CV: {b_cv}")

    # Block 4 — Designer identity (4)
    b_di = c.add_block(SURVEY_ID, "4_Designer_Identity")
    add_likert_block(c, SURVEY_ID, b_di, DESIGNER_ID, "agree")
    print(f"Block 4 DI: {b_di}")

    # Block 5 — Teaching efficacy contagion (3)
    b_tse = c.add_block(SURVEY_ID, "5_Teaching_Efficacy_Contagion")
    add_likert_block(c, SURVEY_ID, b_tse, TSE_CONTAGION, "confidence")
    print(f"Block 5 TSE: {b_tse}")

    # Survey flow
    c.set_flow(SURVEY_ID,
               cohort_flow(SURVEY_ID, default_block, [b_umux, b_aise, b_cv, b_di, b_tse]))
    print("Flow set.")

    summary = {
        "post": {
            "SurveyID": SURVEY_ID,
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
    }
    out = Path(__file__).parent / "_created_surveys.json"
    existing = {}
    if out.exists():
        try:
            existing = json.loads(out.read_text(encoding="utf-8"))
        except Exception:
            pass
    existing.update(summary)
    out.write_text(json.dumps(existing, indent=2), encoding="utf-8")
    print(f"\nWrote {out}")


if __name__ == "__main__":
    main()
