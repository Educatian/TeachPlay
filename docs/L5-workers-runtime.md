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
    sign-test.js       — @digitalbazaar/vc signing smoketest
```

`.assetsignore` exists because without it, wrangler's asset uploader tries to push `node_modules/workerd/bin/workerd` (~118 MiB) as a public file and fails the 25 MiB per-asset limit. Every non-public directory is listed.

## What's deployed (smoketest phase)

Two endpoints, intentionally minimal:

- `GET /api/health` — reports runtime + whether `ISSUER_PRIVATE_KEY_JSON` is bound. No crypto, no deps. If this 200s but `/api/sign-test` does not, the issue is library compatibility, not Worker setup.
- `GET /api/sign-test` — signs a hardcoded minimal `VerifiableCredential` using the issuer key loaded from the secret. If this returns a signed VC and `tools/verify-vc.mjs` verifies it, the whole `@digitalbazaar/vc` stack runs on the Workers runtime and we can promote `issue-for-learner` and `revoke` to real endpoints.

These are **smoketests** and will be deleted once the real issuance route exists. They are safe to leave public: they sign only a fixed placeholder subject, not a learner.

## One-time setup

Two pieces live outside the repo. The first is already done; the second is what's blocking `/api/sign-test`.

1. **Compatibility flag** — `nodejs_compat` on the Worker (confirmed set). `compatibility_date` is 2026-04-19, which is recent enough.
2. **Issuer key secret** — `ISSUER_PRIVATE_KEY_JSON` must be set on the Worker as an **encrypted** environment variable. **Do not** paste the private key into any AI assistant chat or public tool. The two safe paths:
   - **Dashboard**: Worker → Settings → Variables and Secrets → Add → Type: *Secret* → Name `ISSUER_PRIVATE_KEY_JSON` → paste the full JSON from `tools/keys/issuer-ed25519.private.json` → Save.
   - **CLI** (preferred): from a terminal that has the private key file, run `wrangler secret put ISSUER_PRIVATE_KEY_JSON` and paste the JSON when prompted. The value never leaves your machine except to Cloudflare.

The private key file is gitignored (`tools/keys/*.private.json`). The Cloudflare secret is the only production copy.

## Verifying after deploy

```bash
curl https://teachplay.dev/api/health
# → {"ok":true, "env":{"ISSUER_PRIVATE_KEY_JSON":"set"}, ...}

curl https://teachplay.dev/api/sign-test | jq .signed > /tmp/smoketest.json
node tools/verify-vc.mjs /tmp/smoketest.json
# → ✓ VERIFIED
```

If `verify-vc.mjs` passes on an artifact signed inside a Cloudflare Worker by the key held only in a Cloudflare secret, the server runtime is real.

## What this does *not* yet do

- **No auth gate.** Anyone on the public internet can hit `/api/sign-test`. That's acceptable because it signs a fixed placeholder subject. The real `/api/issue` endpoint must reject unauthenticated callers.
- **No persistence.** The status-list bitstring and `credential/status-list-registry.json` still live in Git. A real revocation endpoint needs Cloudflare KV (or D1) so a bit flip doesn't require a commit and redeploy.
- **No rate limit.** Workers has a default CPU budget per request but no per-IP limits; a production endpoint needs Cloudflare's rate-limiting rules.
- **Contexts are fetched, not cached.** The Workers documentLoader hits `www.w3.org` on every sign. Real endpoints should embed the small set of JSON-LD contexts we use (W3C VC v2, OBv3 3.0.3, Multikey v1) as static imports.

Those are the next layers. This one is just: *can we sign on Cloudflare at all*.
