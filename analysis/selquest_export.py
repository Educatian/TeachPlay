#!/usr/bin/env python3
"""Convert SEL Quest suspend_data records into the psychometrics.py feed.

The game (minigames/sel-quest) writes an ECD evidence record to SCORM 1.2
cmi.suspend_data (v2, keyed to minigames/sel-quest/blueprint.json):

    {"v": 2, "bp": "selquest-bp-1.0", "score": 83,
     "claims": {...}, "nodes": {"q_selfAwareness:n1": "best", ...},
     "practice": {...}, "commit": {...}, "retries": {...}}

This script reads a JSONL file of {"pid": ..., "suspend_data": "<json-or-dict>"}
rows (one per learner attempt, e.g. exported from the LMS), keeps only items the
blueprint marks assessed, and emits:

  1. a dichotomous JSONL for analysis/psychometrics.py
     ({"pid", "items": [{"item_id", "correct"}]}, correct = tier == "best" —
     "identified the optimal strategy"), and
  2. a polytomous CSV (pid, item_id, tier, points, claim_id, role) so a
     graded-response/partial-credit extension needs no re-export.

Usage:
    python analysis/selquest_export.py attempts.jsonl \
        --blueprint minigames/sel-quest/blueprint.json \
        --out-jsonl analysis/out/selquest_dichotomous.jsonl \
        --out-csv analysis/out/selquest_polytomous.csv
    python analysis/psychometrics.py analysis/out/selquest_dichotomous.jsonl
"""

import argparse
import csv
import json
import os
import sys

POINTS = {"best": 10, "good": 6, "poor": 2}


def load_blueprint(path):
    with open(path, encoding="utf-8") as f:
        bp = json.load(f)
    rules = {r["itemId"]: r for r in bp.get("evidenceRules", []) if r.get("assessed")}
    return bp, rules


def iter_attempts(path):
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            rec = json.loads(line)
            sd = rec.get("suspend_data")
            if isinstance(sd, str):
                try:
                    sd = json.loads(sd)
                except json.JSONDecodeError:
                    continue
            if isinstance(sd, dict):
                yield rec.get("pid", "unknown"), sd


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("attempts", help="JSONL of {pid, suspend_data} rows")
    ap.add_argument("--blueprint", default="minigames/sel-quest/blueprint.json")
    ap.add_argument("--out-jsonl", default="analysis/out/selquest_dichotomous.jsonl")
    ap.add_argument("--out-csv", default="analysis/out/selquest_polytomous.csv")
    args = ap.parse_args()

    bp, rules = load_blueprint(args.blueprint)
    bp_version = bp.get("blueprintVersion", "?")

    os.makedirs(os.path.dirname(args.out_jsonl) or ".", exist_ok=True)
    os.makedirs(os.path.dirname(args.out_csv) or ".", exist_ok=True)

    n_attempts = 0
    n_skipped_version = 0
    with open(args.out_jsonl, "w", encoding="utf-8") as fj, open(
        args.out_csv, "w", newline="", encoding="utf-8"
    ) as fc:
        writer = csv.writer(fc)
        writer.writerow(["pid", "item_id", "tier", "points", "claim_id", "role"])
        for pid, sd in iter_attempts(args.attempts):
            if sd.get("bp") != bp_version:
                n_skipped_version += 1
                continue
            items = []
            for item_id, tier in sorted((sd.get("nodes") or {}).items()):
                rule = rules.get(item_id)
                if not rule or tier not in POINTS:
                    continue
                items.append({"item_id": item_id, "correct": int(tier == "best")})
                writer.writerow(
                    [pid, item_id, tier, POINTS[tier], rule.get("claimId"), rule.get("role")]
                )
            if items:
                fj.write(json.dumps({"pid": pid, "items": items}) + "\n")
                n_attempts += 1

    print(
        f"wrote {n_attempts} attempts to {args.out_jsonl} and {args.out_csv} "
        f"(blueprint {bp_version}; {n_skipped_version} skipped on version mismatch)"
    )
    if n_attempts < 3:
        print("note: psychometrics.py needs >=3 learners for Rasch, >=8 for 2PL", file=sys.stderr)


if __name__ == "__main__":
    main()
