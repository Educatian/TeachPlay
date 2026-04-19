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
wrangler.toml          — Worker name, main, [assets] binding, [[kv_namespaces]]
.assetsignore          — excludes node_modules, tools/, src/, docs/, configs
src/
  index.js             — single fetch handler; dispatches /api/* then ASSETS
  lib/
    sign.js            — shared documentLoader + signCredential()
    status-list.js     — BitstringStatusList KV helpers + VC builder
  api/
    health.js          — runtime / env smoketest (no crypto)
    issue.js           — POST /api/issue — per-learner VC signing (auth-gated)
    revoke.js          — POST /api/revoke — flip a status bit (auth-gated)
    status-list.js     — GET /api/status-list/<cohort> — signed list (public)
```

`.assetsignore` exists because without it, wrangler's asset uploader tries to push `node_modules/workerd/bin/workerd` (~118 MiB) as a public file and fails the 25 MiB per-asset limit. Every non-public directory is listed.

## What's deployed

Four endpoints:

- `GET /api/health` — reports runtime + whether `ISSUER_PRIVATE_KEY_JSON` is bound. No crypto, no deps. Used to isolate "Worker is up" from "signing stack works."
- `POST /api/issue` — per-learner VC signing, auth-gated. Loads the canonical template (`/credential/assertion-example-v3.unsigned.json`) from the ASSETS binding, customizes subject/evidence/identifier, allocates a fresh index on the cohort's BitstringStatusList (from KV), injects `credentialStatus`, and signs with `eddsa-rdfc-2022` under the key in `ISSUER_PRIVATE_KEY_JSON`.
- `POST /api/revoke` — flip one bit in a cohort's status list, auth-gated. Body `{cohort?, index, value?}`; `value: 1` revokes (default), `value: 0` reinstates.
- `GET /api/status-list/<cohort>` — public. Returns the signed `BitstringStatusListCredential` for that cohort, reading live bits from KV and re-signing on each request. Verifiers fetch this URL when checking a credential whose `credentialStatus.statusListCredential` points here.

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

Four pieces live outside the repo, all on the Worker:

1. **Compatibility flag** — `nodejs_compat` on the Worker. `compatibility_date` is 2026-04-19.
2. **Issuer key secret** — `ISSUER_PRIVATE_KEY_JSON` = the full JSON of `tools/keys/issuer-ed25519.private.json`. **Do not** paste the private key into any AI assistant chat or public tool. Use either:
   - **Dashboard**: Worker → Settings → Variables and Secrets → Add → Type: *Secret* → Name `ISSUER_PRIVATE_KEY_JSON` → paste the full JSON → Save.
   - **CLI** (preferred): `npx wrangler secret put ISSUER_PRIVATE_KEY_JSON` from a terminal that has the private key file. The value never leaves your machine except to Cloudflare.
3. **API key secret** — `ISSUER_API_KEY` = any strong random string (e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). Same two paths (`wrangler secret put ISSUER_API_KEY` is simplest). Without this the endpoint returns 500; with it set but not passed by the caller the endpoint returns 401.
4. **KV namespaces** — two, created once: `STATUS_BITS` (raw bitstrings) and `STATUS_INDEX` (next-free-index counter). Create via `npx wrangler kv namespace create STATUS_BITS` / `... STATUS_INDEX`, then paste the returned IDs into the `[[kv_namespaces]]` blocks in `wrangler.toml`.

The private key file is gitignored (`tools/keys/*.private.json`). The Cloudflare secrets are the only production copies.

## Revocation round-trip

```bash
# Issue — response includes the allocated status index.
curl -sS -X POST https://teachplay.dev/api/issue \
  -H "Authorization: Bearer $ISSUER_API_KEY" \
  -H "content-type: application/json" \
  -d '{"id":"worker-test-02","email":"alum@ua.edu","cohort":"2026-spring"}' \
  | tee /tmp/issued.json | jq .statusIndex
# → 0 (first caller for that cohort)

# Verify — should pass.
jq .signed /tmp/issued.json > /tmp/vc.json
node tools/verify-vc.mjs /tmp/vc.json   # → ✓ VERIFIED

# Revoke — flip the bit.
curl -sS -X POST https://teachplay.dev/api/revoke \
  -H "Authorization: Bearer $ISSUER_API_KEY" \
  -H "content-type: application/json" \
  -d '{"cohort":"2026-spring","index":0}'
# → {"ok":true,"index":0,"previous":0,"current":1}

# Re-verify — suite check still passes, but a status-aware verifier
# that fetches /api/status-list/2026-spring and checks index 0 will
# see the bit set to 1 → revoked.
curl -sS https://teachplay.dev/api/status-list/2026-spring | jq .
```

The Worker never persists the signed status-list credential — it stores only the raw bits in KV and re-signs on each `GET /api/status-list/<cohort>` so `validFrom` stays fresh.

## Why a separate URL namespace from the CLI

The CLI (`tools/status-list.mjs`) keeps a signed `credential/status-list-<cohort>.json` in the repo and a `status-list-registry.json` sidecar. The Worker does not share that state: Worker-issued credentials reference **`/api/status-list/<cohort>`** (dynamic from KV), CLI-issued credentials reference **`/credential/status-list-<cohort>.json`** (static from the repo). The two stores can coexist on the same domain because the URL discriminates which one the verifier fetches. This avoids the CLI's "I edited a signed JSON then forgot to commit" failure mode while keeping existing example credentials (issued before the Worker) fully verifiable.

## What this does *not* yet do

- **Status-index allocation is not atomic.** Workers KV has no compare-and-swap, so `allocateIndex` does `get(next) → put(next+1)`. Two concurrent `/api/issue` calls can read the same `next` and burn one index on a collision. Bit writes in `/api/revoke` have the same window for the byte containing the bit. Fix is a Durable Object singleton per cohort (global order) or D1 row-level update; deferred.
- **No idempotency.** Two POSTs with the same `id` produce two distinct signatures and burn two status indexes. Production flow should dedupe or version per-learner issuances.
- **No rate limit.** Workers has a default CPU budget per request but no per-IP limits; a production endpoint needs Cloudflare's rate-limiting rules in front of `/api/issue` and `/api/revoke`.
- **No LMS SSO.** Auth is a single shared bearer token. Real flow is LTI 1.3 (L2) → issue on behalf of an authenticated learner — that plugs in at `checkAuth`.
