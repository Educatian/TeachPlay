# Tooling Notes

This directory owns build-time and credential utility scripts.

## Local Rules

- `build-search-index.mjs`, `build-sitemap.mjs`, and `sync-nav.mjs` are part of `npm run build`; expect `search-index.json`, `search-index-version.txt`, `sitemap.xml`, and navigation markup to change after the build.
- Keep script module style consistent with the existing file. This package is `commonjs`, but several tools use `.mjs` intentionally.
- Credential scripts must not print or write private key material beyond the explicit key-generation/signing paths requested by the user.
- Prefer structured JSON parsing and serialization for credential, badge, VC, CLR, status-list, and sitemap work.
- If a script changes generated public files, run `cmd /c npm run build` and then the relevant Playwright slice or full `cmd /c npm run ci`.
