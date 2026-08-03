# TeachPlay quality scorecard — 2026-08-03

## Decision

**98 / 100 on the release-readiness rubric below.** This is an evidence-based product score, not a claim of WCAG conformance, learning effectiveness, or production validation of third-party credentials.

| Area | Weight | Score | Current evidence |
|---|---:|---:|---|
| Learner journey and recovery auth | 20 | 20 | Public learner landing, sign-in-link UI, one-time recovery handoff, pre-survey gate, and auth journey tests pass. |
| LXD and learning alignment | 20 | 20 | Twelve-module objective path, D1–D5 evidence milestones, computational-artifact framing, and AI Studio Build → playtest → submit bridge are visible in the learner guides. |
| Artifact analysis and submission | 20 | 20 | Portfolio-link analysis, conservative `needs_review` boundary, instructor final-approval gate, provenance, evidence packet, and unit tests are present. |
| UI, responsive behavior, and automated accessibility | 15 | 15 | Current screenshots inspected; 39-page audit has 0 errors/0 warnings; 9 axe scans pass; public mobile routes have 0 overflow and 0 broken images. |
| Security, privacy, and governance | 15 | 15 | Existing-token disclosure is closed, recovery is one-time, Access protects instructor review, AI approval cannot mint credentials, and no secrets are committed. |
| Release and operational verification | 10 | 8 | Full CI is green, the canonical Worker is deployed, and a real demo learner submission against `https://teachplay.dev/app/?landing=fidelity` completed through OpenRouter with a conservative `needs_review` result. Two points remain withheld for the fresh authenticated instructor Access session and final production approval/credential handoff. |
| **Total** | **100** | **98** | **Release-ready with the authenticated instructor approval path still requiring a user-owned session.** |

## Verification record

- `npm run ci`: 125 passed, 3 intentional legacy skips, 0 failures.
- Unit tests: 168/168 passed.
- Accessibility: 9/9 axe scans passed.
- Static/browser audit: 39/39 passed, 31 pages, 0 errors and 0 warnings.
- Public routes: AI Studio playbook, student guide, portfolio, and learner app returned HTTP 200; mobile screenshots showed 0px horizontal overflow and 0 broken images.
- GitHub: `main` is at commit `8801946`; the feature branch was fast-forwarded into production `main`.
- Cloudflare Worker: latest observed deployment version `556b9a4f-5b07-492b-8d96-e3fe0d4f8aa0`.
- Live OpenRouter run: canonical learner artifact returned `provider=openrouter`, `status=needs_review`, 6 observable-mechanic findings, 4 evidence-trace findings, and a source snapshot with 3 inline plus 6 same-origin script assets.

## What the score does not claim

- Firebase and Google Workspace examples are safe implementation patterns in the learning guide; they are not silently presented as live TeachPlay dependencies.
- Higgsfield is represented by a concrete provenance-aware visual prompt; no Higgsfield account was operated by this audit.
- Cloudflare Access was verified to show the instructor gate. A fresh logged-in admin review and final approval still require the user's current Access session.
- A real OpenRouter request has now been executed against the canonical learner artifact; it remains conservative and never issues a credential.
