# L5 · Cloudflare Workers runtime — server on the canonical domain

The previous layers (L1–L4) all produce **static artifacts** — HTML, signed JSON, rubrics. That was enough for a demonstrable scaffold but it cannot *accept* a wallet pull, sign a fresh per-learner credential on request, or flip a revocation bit. This doc records the first step past that boundary: a server runtime on the same domain, same deploy pipeline.

## Shape: one Worker, Static Assets binding, GitHub auto-deploy

teachplay.dev is a **Worker with a Static Assets binding**, not a Pages project. That distinction matters because the code shape differs:

- Pages Functions: drop files into `functions/api/*.js` and Cloudflare routes them automatically.
- Worker with Assets: a **single `fetch` handler** (declared via `main` in `wrangler.toml`) handles every request, dispatches API routes itself, and delegates anything else to `env.ASSETS.fetch()` so the bound static bucket serves the repo's HTML / JSON / CSS / JS.

Deploy is GitHub-native: `npx wrangler deploy` runs on every push to `main` in Cloudflare's build environment. The worker name is `teachplay`; the canonical domain binding (`teachplay.dev`) is managed in the Dashboard and persists across deploys.

## Why not a separate Worker / a separate host

- **Separate Workers project on `api.teachplay.dev`** — one more deploy pipeline, CORS headaches, and a DID (`did:web:teachplay.dev`) that no longer sits at the API origin.
- **Node host (Fly / Render / Railway)** — requires a container, secret management on a second provider, and DNS to stitch it back to the canonical domain.
- **Keep it static** — ruled out by the goal (real issuance, real revocation).

The Workers runtime is a V8 isolate, not Node. The `nodejs_compat` flag in `wrangler.toml` lets `@digitalbazaar/vc` and its dependency chain (`jsonld`, `@digitalbazaar/data-integrity`, `@digitalbazaar/ed25519-multikey`) resolve `node:crypto`, `node:buffer`, `node:stream` at build time.

## Repo layout

```
wrangler.toml          — Worker name, main = src/index.js, [assets] binding
.assetsignore          — excludes node_modules, tools/, src/, docs/, configs
src/
  index.js             — single fetch handler; dispatches /api/* then ASSETS
  api/
    health.js          — runtime / env smoketest (no crypto)
    issue.js           — POST /api/issue — per-learner VC signing (auth-gated)
```

`.assetsignore` exists because without it, wrangler's asset uploader tries to push `node_modules/workerd/bin/workerd` (~118 MiB) as a public file and fails the 25 MiB per-asset limit. Every non-public directory is listed.

## What's deployed

Two endpoints:

- `GET /api/health` — reports runtime + whether `ISSUER_PRIVATE_KEY_JSON` is bound. No crypto, no deps. Used to isolate "Worker is up" from "signing stack works."
- `POST /api/issue` — per-learner VC signing, auth-gated. Accepts a learner payload, loads the canonical template (`/credential/assertion-example-v3.unsigned.json`) from the ASSETS binding, customizes subject/evidence/identifier to match `tools/issue-for-learner.mjs`, and signs with the `eddsa-rdfc-2022` cryptosuite under the key held in `ISSUER_PRIVATE_KEY_JSON`.

Request shape:

```bash
curl -sS -X POST https://teachplay.dev/api/issue \
  -H "Authorization: Bearer $ISSUER_API_KEY" \
  -H "content-type: application/json" \
  -d '{
    "id":        "worker-test-01",
    "email":     "test@ua.edu",
    "name":      "Worker Test",
    "cohort":    "2026-spring",
    "validFrom": "2026-05-02T00:00:00Z"
  }' \
  | jq .signed > /tmp/issue.json

node tools/verify-vc.mjs /tmp/issue.json
# → ✓ VERIFIED
```

`id` is required (`[a-zA-Z0-9_-]{2,64}`). `cohort` is optional (defaults to `2026-spring`, must match `[a-z0-9-]{2,32}`). `email` is optional; when present it is hashed with the cohort as salt (SHA-256, hex) and placed in `credentialSubject.identifier` as an `IdentityObject` — never stored plaintext. `validFrom` defaults to issuance time.

Auth: the `Authorization: Bearer <token>` (or `X-API-Key`) header is compared against the `ISSUER_API_KEY` secret with a constant-time check. No auth = 401, no subject leak, no crypto work.

## One-time setup

Three pieces live outside the repo, all on the Worker:

1. **Compatibility flag** — `nodejs_compat` on the Worker. `compatibility_date` is 2026-04-19.
2. **Issuer key secret** — `ISSUER_PRIVATE_KEY_JSON` = the full JSON of `tools/keys/issuer-ed25519.private.json`. **Do not** paste the private key into any AI assistant chat or public tool. Use either:
   - **Dashboard**: Worker → Settings → Variables and Secrets → Add → Type: *Secret* → Name `ISSUER_PRIVATE_KEY_JSON` → paste the full JSON → Save.
   - **CLI** (preferred): `npx wrangler secret put ISSUER_PRIVATE_KEY_JSON` from a terminal that has the private key file. The value never leaves your machine except to Cloudflare.
3. **API key secret** — `ISSUER_API_KEY` = any strong random string (e.g. `openssl rand -hex 32`). Same two paths (`wrangler secret put ISSUER_API_KEY` is simplest). Without this the endpoint returns 500; with it set but not passed by the caller the endpoint returns 401.

The private key file is gitignored (`tools/keys/*.private.json`). The Cloudflare secrets are the only production copies.

## What this does *not* yet do

- **No credentialStatus.** `/api/issue`-minted credentials carry no BitstringStatusList entry, so they cannot be revoked. Allocating a status index from the Worker requires writable persistence (Cloudflare KV / D1); that is the next layer. Credentials issued via the `tools/issue-for-learner.mjs` CLI pipeline still get a status entry and can be revoked.
- **No idempotency.** Two POSTs with the same `id` produce two distinct signatures. Production flow should dedupe or version per-learner issuances (KV again).
- **No rate limit.** Workers has a default CPU budget per request but no per-IP limits; a production endpoint needs Cloudflare's rate-limiting rules in front of `/api/issue`.
- **No LMS SSO.** Auth is a single shared bearer token. Real flow is LTI 1.3 (L2) → issue on behalf of an authenticated learner — that plugs in at `checkAuth`.
