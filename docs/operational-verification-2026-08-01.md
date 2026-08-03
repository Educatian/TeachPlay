# TeachPlay operational verification

Date: 2026-08-01  
Scope: learner submission → computational analysis → instructor approval → credential claim

## Evidence captured

| Stage | Evidence | Result |
|---|---|---|
| Learner submission | `tests/unit/portfolio-review.test.mjs` | A learner-token-gated submission is accepted only for an allowlisted HTTPS artifact host; unsupported hosts are rejected before storage. |
| Computational analysis | `tests/unit/portfolio-review.test.mjs` | The OpenRouter request is sent with `google/gemini-3.5-flash`; conservative JSON analysis is stored and exposed for review. |
| Instructor review | `tests/unit/portfolio-review.test.mjs`, `tests/admin-review-ui.spec.mjs` | Access/issuer authentication, `needs_review` state, analysis evidence, risks, rubric hints, final approval, and automatic Access-session restore are covered. |
| Rubric gate | `tests/unit/rubric.test.mjs`, `tests/unit/admin-approve.test.mjs` | All five deliverables and all 25 criteria at least Proficient are required; incomplete gates mint no claim token. |
| Credential signing | `tests/unit/issue-embed.test.mjs`, `tests/unit/verify-credential.test.mjs` | A passing gate creates a claim token and the signed credential verifies; tampering fails verification. |
| Production protection | `curl` against `/api/admin/portfolio-review` | Cloudflare Access returns `302` and the `Www-Authenticate: Cloudflare-Access` challenge. |

## Automated run

```text
npm run test:unit
VC verification: VERIFIED
tests 164
pass 164
fail 0
```

The current full CI rerun recorded 117 browser passes with 3 intentional legacy skips and 0 failures. The current surface audits recorded 38/38 checks with 0 errors and 0 warnings, 8/8 accessibility passes with 0 axe violations, and 42 pages / 41 media requests with 0 media failures.

## Production acceptance status

Read-only production D1 checks on 2026-08-01 found the seeded demo review
`demo-review-2026-08-01` for `demo-learner-2026-08-01`. It is an actual
`openrouter` review with 4,881 characters of analysis and a conservative
`needs_review` recommendation. The same learner currently has 0 completed
session events, 0 evidence deliverables, and 0 Proficient/Exemplary rubric
scores, so the issuance gate correctly cannot pass yet.

The complete production sequence is **not yet claimed as passed**. The remaining evidence must come from one authenticated browser session and must include:

1. a real learner portfolio submission;
2. the resulting OpenRouter analysis record in the production review queue;
3. instructor review of the evidence and final approval;
4. production rubric scoring for all five deliverables and 25 criteria;
5. a one-time claim link redemption and downloaded signed credential;
6. public verifier success for that credential.

The deployed review surface was rechecked through an authenticated Cloudflare Access browser session on 2026-08-01. It loaded the seeded `needs_review` review, showed the stored analysis evidence, and rendered no `[object Object]` placeholder. This confirms the protected review read path, not the complete production learner-to-credential sequence.

Current deployment checked: `a983f669-eee4-4c54-b240-93ec9d400715`.
