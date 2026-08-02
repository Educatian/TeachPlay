# Manual accessibility review record — 2026-08-01

## Scope

This record separates what was checked by a person using the browser and what was
covered only by automated tooling. It is evidence for the current release, not a
claim of WCAG conformance.

## Evidence reviewed

| Surface | Manual check | Result | Limit |
|---|---|---|---|
| Learner landing and course shell | Keyboard navigation, visible focus, compact navigation labels, mobile/desktop layout | Pass on the tested landing, course, evidence, and certificate paths | This is a representative slice, not every control on every page |
| Evidence submission | Context → Evidence navigation, draft persistence, file-upload state, accessible button targeting | Pass; the canvas shell's overview label is intentionally distinct from the React Evidence control | File upload was exercised with a deterministic local fixture |
| Static handbook pages | Skip link, primary navigation, search trigger, modal/lightbox keyboard paths | Pass in the current Playwright interaction suite | No assistive technology was attached during this run |
| Local walkthrough video | `<track kind="captions">` presence and transcript/download links on the student completion guide | Present and reachable | Caption wording was not independently line-edited against the audio in this run |
| Embedded YouTube workflow videos | Page-level title/context and disclosure | Partial | YouTube's internal caption quality remains outside the local DOM audit |

## Automated corroboration

- `npm run a11y`: 8 representative pages, 0 axe violations.
- Full Playwright gate: 120 checks in the current suite, with intentional legacy skips documented by the smoke tests.
- The audit suite records 30 static pages with 0 errors and 0 warnings; that is surface coverage, not full conformance.

## Open manual checks

1. Run NVDA or VoiceOver through the full learner path, including the React evidence editor and certificate handoff.
2. Compare every caption track and transcript against the rendered audio with a human reviewer.
3. Recheck zoom at 200% and 400% for the catalog, evidence editor, admin review, and certificate preview.

The site keeps these items open rather than treating axe or DOM checks as a substitute
for a screen-reader or human caption review.
