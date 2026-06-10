# Measurement & validity layer

TeachPlay turns its descriptive analytics into **measured psychometrics** so an
instructor can see whether the credential's assessment actually holds — is the
quiz reliable, do rubric criteria discriminate, do two raters agree, are learners
well-calibrated about their own skill?

## The split: Worker-light (live) / Python-heavy (offline)

The architectural rule for this stack is that the Cloudflare Worker computes only
**closed-form, cheap statistics** (single-pass, no libraries) plus a de-identified
export. Anything **iterative or heavy** (IRT/Rasch fitting, bootstrap CIs) runs
**offline in Python** on the analyst's machine.

| | Worker (live, closed-form) | Python (offline, iterative) |
|---|---|---|
| Endpoint / file | `GET /api/admin/psychometrics` · `src/lib/psychometrics.js` | `analysis/psychometrics.py` (reads `/api/admin/export`) |
| Quiz | p-value, corrected point-biserial discrimination, item flags, **KR-20 / Cronbach's α** | **1PL/Rasch** difficulties + abilities, **2PL** discrimination, KR-20 cross-check |
| Rubric | per-criterion difficulty, 4-level distribution, redundancy flags | — |
| Inter-rater (IRR) | **Cohen's κ**, **Fleiss' κ**, **Gwet's AC1** (point estimates) | same three **with bootstrap 95% CIs** |
| Calibration | signed bias, over/under rates, **Brier**, **ECE**, **Goodman-Kruskal γ**, pre→post shift | — |

The Worker numbers are what the dashboard shows in real time. The Python script is
the research-grade cross-check + the IRT layer the Worker intentionally does not
attempt. Every Worker section degrades to `{status:'insufficient', n}` on
small/empty data — it never 500s.

## Data sources (live xAPI shape)

- **Quiz items** — `verb='answered'`, `activity_type='quiz-item'`, `success` 0/1 per item per learner. Built into a complete-case learner × item matrix (items answered by ≥60% of learners; last attempt per learner).
- **Quiz totals** — `verb='scored'`, `activity_type='quiz'`, `score_raw`/`score_max`. Used as the measured-performance anchor for calibration.
- **Self-assessment** — `verb='responded'`, `activity_type='self-assessment'`, `score_raw` on 0–4 (`self-assessment/{pre|post}/<skill>`). Used as the confidence side of calibration. *(The old analytics query filtered `verb='answered'` here, which is wrong — that bug is fixed; the skills-growth panel now populates.)*
- **Rubric** — `rubric_scores` (authoritative latest-per-criterion, single-rater — what `rubricPassed` / the issuance gate read, **unchanged**) and `rubric_scores_raters` (migration 0009, append per (learner, criterion, scorer) → enables IRR).

## How to read each metric

- **KR-20 / α ≥ 0.70** — conventional reliability floor for a credentialing quiz.
- **Point-biserial discrimination < 0.2** — item does not separate stronger from weaker learners (revision candidate). `degenerate` = an item with no variance.
- **p-value** — difficulty; `<0.15` too-hard, `>0.95` too-easy carry little information.
- **Rubric difficulty** — % of learners at Proficient-or-higher. `never-fails`/`always-fails` flags mark non-informative criteria.
- **Redundant pairs** — criteria with |r| ≥ 0.9 may be measuring the same thing.
- **κ / AC1 ≥ 0.60** — "substantial agreement". Gwet's **AC1** is reported beside κ because κ collapses toward 0 when one rubric level dominates (the prevalence paradox); AC1 is robust to that. Fleiss' κ appears once ≥3 raters score a common cell set.
- **Calibration signed bias** > 0 = over-confident; the **pre→post shift toward 0** is the metacognitive-growth signal. **Brier** lower is better; **γ** is the rank association of confidence with correctness.

## De-identified export

`GET /api/admin/export` (JSONL default, `?format=csv`) emits **no PII**: each
learner id and rater email is replaced by a stable salted SHA-256 pseudonym (16
hex), salt derived from `ISSUER_API_KEY`. Schema and offline run instructions are
in [`analysis/README.md`](../analysis/README.md).

## Honesty note

These are the **tools to measure** reliability, not a claim that the credential is
reliable. Real κ should be reported only once a real cohort is **double-scored** by
two instructors; until then IRR correctly reports `insufficient`.

## Invariants (what this layer does NOT touch)

The measurement layer is read-only and additive. It does not change credential
signing/crypto, the VC / OB-v3 schema, or the `rubricPassed` /
`evaluateCredentialGate` issuance semantics. `rubric_scores` remains the sole
authoritative source the gate reads; `rubric_scores_raters` is observational only.
