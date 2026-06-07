# Learner Workspace Notes

This directory contains the `/app` learner workspace shell and post-build scripts that refine the React learner experience.

## Local Rules

- Keep overlay scripts small and focused. If a behavior belongs to an existing `teachplay-*.js` module, patch that module; otherwise add a narrowly named new module.
- Update both `index.html` and `app/index.html` when a root landing change also needs the learner workspace bundle loaded.
- Preserve selectors used by Playwright smoke and regression tests. In particular, do not make multiple visible controls share the same exact accessible name unless the tests are updated intentionally.
- Keep certificate preview behavior tied to the current learner identity and submitted evidence owner.
- Keep certificate-specific presentation in `teachplay-certificate-preview.css` instead of injecting large CSS strings into JavaScript.
- Avoid editing hashed or bundled build output if the source pathway is discoverable.

## Verification

For app changes, run a focused regression first, then the full gate when behavior or layout changes:

```powershell
cmd /c npx playwright test tests/david-fixes.spec.mjs --reporter=list
cmd /c npm run ci
```
