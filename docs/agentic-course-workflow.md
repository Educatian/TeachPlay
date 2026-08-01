# TeachPlay agentic course workflow

This is the operating contract for the instructor-facing course workflow. The
agent may inspect and summarize a computational artifact; it may not approve a
learner or issue a credential.

## Learner canvas

1. The learner enters the guided course and works through the 12-module sequence.
2. Each lesson keeps the learning objective, player action, observable evidence,
   and revision prompt in one reading rail.
3. Evidence drafts are stored locally while the learner moves between Context,
   Evidence, and review tabs. Files are sent to `/api/evidence-file` only after
   learner authentication.
4. The learner submits a hosted artifact link through `/api/portfolio-review`.

## Instructor agentic review

1. The worker fetches only allowlisted HTTPS hosts and strips executable content.
2. OpenRouter (or the configured fallback provider) returns a conservative JSON
   analysis covering the learning objective, state/mechanics, evidence traces,
   alignment, risks, evidence questions, and rubric hints.
3. The record remains `needs_review`; the model cannot set `approved` and cannot
   mint a claim token.
4. An authenticated instructor reviews the analysis in `admin-review.html` and
   may final-approve or reject the review.

## Analytics and issuance gate

`/api/admin-analytics` aggregates learner progress, session funnel, question
difficulty, skills growth, and survey status. Analytics are advisory and do not
override the credential gate.

`/api/admin/approve` issues a claim token only when:

- required sessions are complete;
- all five deliverables are present; and
- all 25 non-compensatory criteria are at least Proficient.

The claim endpoint signs the credential, allocates a status-list index, and the
public verifier checks the signature and revocation state. Rejection or failed
gates never create an issued credential.

## Verification contract

- Unit coverage: `tests/unit/portfolio-review.test.mjs`, `rubric.test.mjs`,
  `gate-survey.test.mjs`, `issue-embed.test.mjs`, and `verify-credential.test.mjs`.
- UI coverage: `tests/admin-review-ui.spec.mjs` and the learner flow cases in
  `tests/david-fixes.spec.mjs`.
- Full surface coverage: `tests/a11y.spec.mjs` and `tests/audit.spec.mjs`.

Production acceptance still requires a real Cloudflare Access instructor
session, a configured AI provider, D1 migrations, and an R2 binding for the
100 MB evidence cap.
