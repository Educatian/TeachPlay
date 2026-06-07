# Playwright Test Notes

Tests run with `playwright.config.mjs`: base URL `http://127.0.0.1:8765`, Chromium only, one worker, list reporter, trace/screenshot/video off by default.

## Local Rules

- Add regression coverage near the behavior being fixed: `david-fixes.spec.mjs` for targeted product regressions, `smoke.spec.mjs` for core flows, `audit.spec.mjs` for whole-site audit expectations, and `a11y.spec.mjs` for axe coverage.
- Keep tests deterministic and local. Do not depend on live teachplay.dev or third-party network services unless a task explicitly asks for production verification.
- Prefer user-visible selectors and accessible names. When duplicate names are intentional, scope locators with a stable parent or data attribute.
- Do not remove skipped legacy cases just to make counts cleaner; update or unskip only when the underlying flow is intentionally restored.
- Do not leave generated traces, screenshots, or videos in the repo unless the user explicitly asks for artifact evidence.

## Commands

```powershell
cmd /c npx playwright test tests/smoke.spec.mjs --reporter=list
cmd /c npx playwright test tests/audit.spec.mjs --reporter=list
cmd /c npx playwright test tests/david-fixes.spec.mjs --reporter=list
cmd /c npm run ci
```
