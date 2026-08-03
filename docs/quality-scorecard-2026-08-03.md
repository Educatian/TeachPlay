# TeachPlay quality scorecard — 2026-08-03

## Decision

**95 / 100 on the release-readiness rubric below.** This is an evidence-based product score, not a claim of WCAG conformance, learning effectiveness, or production validation of third-party credentials.

| Area | Weight | Score | Current evidence |
|---|---:|---:|---|
| Learner journey and recovery auth | 20 | 20 | Public learner landing, sign-in-link UI, one-time recovery handoff, pre-survey gate, and auth journey tests pass. |
| LXD and learning alignment | 20 | 20 | Twelve-module objective path, D1–D5 evidence milestones, computational-artifact framing, and AI Studio Build → playtest → submit bridge are visible in the learner guides. |
| Artifact analysis and submission | 20 | 20 | Portfolio-link analysis, conservative `needs_review` boundary, instructor final-approval gate, provenance, evidence packet, and unit tests are present. |
| UI, responsive behavior, and automated accessibility | 15 | 15 | Current screenshots inspected; 39-page audit has 0 errors/0 warnings; 9 axe scans pass; public mobile routes have 0 overflow and 0 broken images. |
| Security, privacy, and governance | 15 | 15 | Existing-token disclosure is closed, recovery is one-time, Access protects instructor review, AI approval cannot mint credentials, and no secrets are committed. |
| Release and operational verification | 10 | 5 | Full CI is green and the Worker is deployed; the remaining 5 points are intentionally withheld from this score because a real instructor Access session and a live OpenRouter analysis with a user-owned artifact were not executed in this audit. |
| **Total** | **100** | **95** | **Release-ready with two explicitly named operational checks remaining.** |

## Verification record

- `npm run ci`: 125 passed, 3 intentional legacy skips, 0 failures.
- Unit tests: 167/167 passed.
- Accessibility: 9/9 axe scans passed.
- Static/browser audit: 39/39 passed, 31 pages, 0 errors and 0 warnings.
- Public routes: AI Studio playbook, student guide, portfolio, and learner app returned HTTP 200; mobile screenshots showed 0px horizontal overflow and 0 broken images.
- GitHub: commit `7f39b9b` pushed to `agent/teachplay-ui-content-audit`.
- Cloudflare Worker: version `b9aacae3-c837-4e08-ba8b-a5d5e4e5875f` deployed.

## What the score does not claim

- Firebase and Google Workspace examples are safe implementation patterns in the learning guide; they are not silently presented as live TeachPlay dependencies.
- Higgsfield is represented by a concrete provenance-aware visual prompt; no Higgsfield account was operated by this audit.
- Cloudflare Access was verified to show the instructor gate. A successful logged-in admin review requires the user's current Access session.
- A real OpenRouter request requires a real submitted artifact and production key; the bounded analysis behavior is covered by unit tests and the local learner submission flow.
