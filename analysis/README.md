# TeachPlay offline psychometrics kit

The credential-validity measurement layer is split in two on purpose:

| Layer | Where | What it computes | Why there |
|-------|-------|------------------|-----------|
| **Worker (closed-form, LIVE)** | `src/lib/psychometrics.js` + `GET /api/admin/psychometrics` | item p-values, corrected point-biserial discrimination, **KR-20 / Cronbach's α**, rubric difficulty + level distribution + redundancy flags, **Cohen's κ / Fleiss' κ / Gwet's AC1**, calibration (signed bias, **Brier**, **ECE**, **Goodman-Kruskal γ**, pre→post shift) | Single-pass, cheap, no libraries — safe to run inside a Cloudflare Worker on a class-sized cohort and surface on the dashboard in real time. |
| **Python (iterative, OFFLINE)** | `analysis/psychometrics.py` | **1PL / Rasch** item difficulties + person abilities, **2PL** discrimination (when data support it), reliability cross-check vs the Worker's KR-20, full **κ study** (Cohen / Fleiss / Gwet with bootstrap 95% CIs) | Iterative MLE optimization and many-resample bootstraps are not Worker-shaped. They run on the user's machine over a de-identified export. |

The Worker numbers are the dashboard numbers. This script is the research-grade
cross-check + the IRT layer that the Worker intentionally does not attempt.

## Get the data (de-identified)

```bash
curl -H "Authorization: Bearer $ISSUER_API_KEY" \
  https://<your-worker>/api/admin/export > export.jsonl
```

`/api/admin/export` emits **no PII**. Every learner id and rater email is replaced
by a stable salted SHA-256 pseudonym (16 hex chars); the salt is derived from the
Worker's `ISSUER_API_KEY`, so pseudonyms are stable across exports but not
reversible without the key.

### JSONL schema (one record per learner)

```jsonc
{
  "v": 1,
  "pid": "<16-hex>",                 // hashed learner id (stable pseudonym)
  "cohort": "<string|null>",
  "sessions_done": 12,
  "cred_status": "issued|pending|null",
  "items": [ {"item_id": "quiz-item/LO 1.1", "correct": 0|1}, ... ],   // last attempt per item
  "quiz_totals": [ {"quiz": "quiz/s02-quiz", "raw": 2, "max": 4}, ... ],
  "self_assessment": [ {"phase": "pre|post", "skill": "LXD", "raw": 1, "max": 4}, ... ],
  "rubric_raters": [ {"criterion": "d1-learner-specificity", "rater": "<16-hex>", "level": "Proficient"}, ... ]
}
```

`?format=csv` returns the same data in long form (one row per response):
`pid,cohort,sessions_done,cred_status,kind,key,value,extra`.

## Run

```bash
pip install -r analysis/requirements.txt
python analysis/psychometrics.py export.jsonl
# or
python analysis/psychometrics.py export.jsonl --out analysis/out/psychometrics_offline.json --boot 2000
```

Writes `analysis/out/psychometrics_offline.json`:

- `reliability.cronbach_alpha_kr20` — cross-check vs the Worker's live KR-20 (should match closely on a dichotomous item matrix).
- `rasch_1pl` — `b` (item difficulties) + `theta` (person abilities) on the logit scale, `item_difficulty` map, convergence flag.
- `irt_2pl` — `a` (discrimination) + `b` + `theta` when ≥8 persons and ≥4 items; otherwise `{"status":"skipped"}`.
- `kappa_study` — pairwise Cohen's κ + Gwet's AC1 (each with bootstrap 95% CI), pooled overall, Fleiss' κ when ≥3 raters per cell.

## How to read the numbers

- **KR-20 / α ≥ 0.70** is the conventional reliability floor for a credentialing quiz; below that, item scores are noisy.
- **Point-biserial discrimination < 0.2** flags an item that does not separate stronger from weaker learners — a candidate for revision/removal.
- **p-value** is difficulty: very high (>0.95) or very low (<0.15) items carry little information.
- **κ / AC1 ≥ 0.60** is the conventional "substantial agreement" bar for two raters. Gwet's AC1 is reported alongside κ because κ collapses toward 0 when one level dominates (the prevalence paradox); AC1 is robust to that.
- **Calibration signed bias** > 0 = learners are over-confident relative to measured performance; the pre→post shift toward 0 is the metacognitive-growth signal.

## Honesty note

These are the **tools** to measure reliability, not a claim that the credential
is reliable. Report real κ only once a **real cohort is double-scored** by two
instructors. Until then the IRR sections correctly say `insufficient`.

Not wired into CI — this is an analyst-run, on-demand script.
