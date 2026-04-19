# L5 · Cloudflare Pages Functions — server runtime

The previous layers (L1–L4) all produce **static artifacts** — HTML, signed JSON, rubrics. That was enough for a demonstrable scaffold but it cannot *accept* a wallet pull, sign a fresh per-learner credential on request, or flip a revocation bit. This doc records the first step past that boundary: a server runtime on the same domain, same deploy pipeline.

## Why Pages Functions (not Workers, not a separate host)

teachplay.dev is already on Cloudflare Pages. Adding `functions/*.js` files to the repo turns the same deploy into a mixed static + dynamic site — every file in `functions/` becomes an endpoint under the real domain, sharing TLS, cache, and origin with the existing pages. The alternatives each cost more:

- **Separate Workers project on `api.teachplay.dev`** — one more deploy pipeline, CORS, and a DID (`did:web:teachplay.dev`) that no longer sits at the API origin.
- **Node host (Fly / Render / Railway)** — requires a container, secret management on a second provider, and DNS to stitch it back to the canonical domain.
- **Keep it static** — ruled out by the goal (real issuance, real revocation).

Pages Functions run in a V8 isolate, not Node. The only thing we need is the `nodejs_compat` flag so `@digitalbazaar/vc` and its dependency chain (`jsonld`, `@digitalbazaar/data-integrity`, `@digitalbazaar/ed25519-multikey`) can resolve `node:crypto`, `node:buffer`, `node:stream`.

## What's deployed

Two endpoints, intentionally minimal:

- `GET /api/health` — reports runtime + whether `ISSUER_PRIVATE_KEY_JSON` is bound. No crypto, no deps. If this 200s but `/api/sign-test` does not, the problem is library compatibility, not Pages.
- `GET /api/sign-test` — signs a hardcoded minimal `VerifiableCredential` using the issuer key loaded from the secret. If this returns a signed VC, the whole `@digitalbazaar/vc` stack runs on the Workers runtime and we can promote `issue-for-learner` and `revoke` to real endpoints.

These are **smoketest endpoints** and will be deleted once the real issuance route exists. They are safe to leave public: they sign only a fixed placeholder subject, not a learner.

## One-time dashboard setup (required before the endpoints work)

These two steps cannot be done from the repo — they live in the Cloudflare Pages project settings and must be set once before `/api/sign-test` will succeed.

1. **Enable `nodejs_compat`** — Pages project → Settings → Functions → Compatibility flags → add `nodejs_compat` to **Production** (and to Preview if you want PR previews to work too). Also confirm the Compatibility date is recent (2024-09-23 or later).
2. **Bind the issuer key** — Pages project → Settings → Environment variables → Add variable:
   - Variable name: `ISSUER_PRIVATE_KEY_JSON`
   - Value: the entire JSON contents of `tools/keys/issuer-ed25519.private.json`, pasted as one string
   - **Click *Encrypt*** before saving so the value becomes a secret (not visible to other collaborators, not printed in build logs). Add it to Production (and Preview if desired).

The private key file itself is gitignored (`tools/keys/*.private.json`) and must never be committed. The dashboard secret is the only production copy.

## Verifying after deploy

```bash
curl https://teachplay.dev/api/health
# → {"ok":true, "env":{"ISSUER_PRIVATE_KEY_JSON":"set"}, ...}

curl https://teachplay.dev/api/sign-test
# → {"ok":true, "signed":{ "@context":[...], "proof":{...} }}
```

Then round-trip the signed artifact through the existing verifier to prove it's a real signature:

```bash
curl -s https://teachplay.dev/api/sign-test | jq .signed > /tmp/smoketest.json
node tools/verify-vc.mjs /tmp/smoketest.json
# → ✓ VERIFIED
```

If `verify-vc.mjs` passes on an artifact signed inside a Cloudflare Worker by the key held only in a Cloudflare secret, the server runtime is real.

## What this does *not* yet do

- **No auth gate.** Anyone on the public internet can hit `/api/sign-test`. That's acceptable because it signs a fixed placeholder subject. The real `/api/issue` endpoint must reject unauthenticated callers.
- **No persistence.** The status-list bitstring and the `credential/status-list-registry.json` still live in Git. A real revocation endpoint needs Cloudflare KV (or D1) so a bit flip doesn't require a commit and redeploy.
- **No rate limit.** Workers has a default CPU budget per request but no per-IP limits; a production endpoint needs Cloudflare's rate-limiting rules.
- **Contexts are fetched, not cached.** The Workers documentLoader hits `www.w3.org` on every sign. Real endpoints should embed the small set of JSON-LD contexts we use (W3C VC v2, OBv3 3.0.3, Multikey v1) as static imports.

Those are the next layers. This one is just: *can we sign on Cloudflare at all*.
