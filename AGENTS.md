# TeachPlay Project Notes

TeachPlay is a static Cloudflare Pages microcredential site with a learner workspace, credential preview/verification flows, and Worker-style API handlers under `src/`.

## Structure

- `index.html` and top-level `*.html` are the published static pages for teachplay.dev.
- `app/` is the learner workspace shell plus small post-build overlay scripts.
- `src/api/` and `src/lib/` contain Cloudflare Worker API handlers and credential/security helpers.
- `credential/` contains badge, VC, CLR, issuer, assertion, and verification JSON artifacts.
- `resources/`, `guides/`, and `docs/` contain learner-facing and project documentation.
- `tools/` contains build, search, sitemap, credential, walkthrough, and signing scripts.
- `tests/` contains Playwright audit, accessibility, smoke, and regression coverage.

## Commands

- Install dependencies with `npm install`.
- Build generated site artifacts with `cmd /c npm run build`.
- Run the full verification gate with `cmd /c npm run ci`.
- Run focused Playwright slices with `cmd /c npx playwright test <file> --reporter=list`.
- If a manual static server is needed, use `python -m http.server 8765`; Playwright expects `http://127.0.0.1:8765`.

Use `cmd /c npx ...` on Windows because PowerShell may block the `npx.ps1` shim.

## Project Conventions

- Keep the site static-first. Prefer small, targeted scripts over introducing a framework build unless the task explicitly calls for it.
- Preserve the existing script load order in both `index.html` and `app/index.html`; several learner-workspace overlays depend on earlier scripts.
- Do not edit generated artifacts by hand when a tool owns them. `npm run build` updates navigation, search index files, and sitemap output.
- Credential and certificate code should bind evidence, learner identity, and verification state together. Avoid demo learner fallbacks in production-facing certificate views.
- Public pages should remain accessible and layout-stable at both desktop and mobile Playwright viewports.
- Do not commit secrets, private keys, raw email contents, or learner-private data. Credential examples must stay synthetic unless the user explicitly provides safe fixture data.

## Current QA Gate

After the 2026-06-07 refinement pass, the expected full gate is:

```powershell
cmd /c npm run ci
```

Expected result at handoff: 110 passed, 3 skipped, site audit over 28 pages with 0 errors and 0 warnings.
