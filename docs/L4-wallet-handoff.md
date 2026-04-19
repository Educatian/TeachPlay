# L4 · Wallet handoff — design note

Design-only. This document specifies how a learner's verified `OpenBadgeCredential` (OBv3 / VC 2.0) leaves `teachplay.dev` and lands inside a wallet the learner controls — a DCC Learner Credential Wallet (LCW), a generic OID4VCI-conformant wallet, or a plain file on disk for fallback. It is written so that (a) a production engineer can wire the signing pipeline without re-deriving the protocol choices, and (b) a reviewer can see which parts of the scaffold are load-bearing and which are placeholders.

Status: **signing pipeline live; per-learner issuance wired through a one-time claim-code; OID4VCI issuer endpoints still to build**. Three handoff paths are live on `credential.html#wallet` (static scaffold) and now also at `/claim?code=<code>` (code-bound, per-learner). The example VC at `credential/assertion-example-v3.json` is signed with a real Ed25519 Data Integrity proof (`eddsa-rdfc-2022`) bound to `did:web:teachplay.dev`, and verifies end-to-end via `npm run verify:example`. The Worker endpoint `/api/claim` re-signs a per-learner VC on redemption, so the learner-facing path never serves a static file.

---

## The job

Once a learner has earned the credential, three things must be true:

1. **They can carry it** — off our servers, into a wallet they control, without asking us.
2. **A verifier can trust it** — the assertion proves itself without contacting UA; no phone-home required.
3. **We don't lock out learners on the "wrong" wallet** — DCC LCW is our default, but the learner should not be forced to install one specific app to receive what they earned.

Handoff quality is what separates a credential from a certificate-as-image. If the only way to share the credential is "screenshot the badge," none of the OBv3 / VC 2.0 machinery is load-bearing.

## Handoff paths

Three paths are published side-by-side. They are not alternatives — they are a fallback chain.

| Path | Primary user | Mechanism | Current status |
| --- | --- | --- | --- |
| P1 · DCC LCW | Learners in teacher-education programs where UA recommends LCW | `dccrequest://` deep link that passes `issuer`, `vc_request_url`, `challenge` | **Scaffold wired**. Deep link constructs correctly; pointed at static VC file. |
| P2 · VC 2.0 JSON download | Learners on any wallet that supports "add from file" (Lissi, Trinsic, Microsoft Entra, Polygon ID) | Browser downloads signed VC to disk | **Scaffold wired**. File served from `credential/assertion-example-v3.json`. |
| P3 · OID4VCI offer | Mobile-first users scanning a QR with an OID4VCI wallet | `openid-credential-offer://` URL carrying `credential_issuer` + pre-authorized code | **Scaffold wired**. URL constructs correctly; issuer endpoint not yet live. |

### P1 — DCC Learner Credential Wallet

DCC's Learner Credential Wallet is the convergence point for the Digital Credentials Consortium member institutions (MIT, UC Berkeley, UC Irvine, Harvard, Georgetown, others). The `dccrequest://` URL scheme is documented in the [LCW repository](https://github.com/digitalcredentials/learner-credential-wallet).

Parameters we send:

```
dccrequest://request?
  auth_type=code
  &issuer=https://teachplay.dev/credential/issuer-v3.json
  &vc_request_url=https://teachplay.dev/credential/assertion-example-v3.json
  &challenge=<nonce>
```

The wallet fetches `vc_request_url`, verifies the Data Integrity proof against the issuer's public key (which it resolves from the issuer profile), and stores the credential. The `challenge` nonce prevents replay.

**To productionize P1:**

1. ~~Stand up a per-learner endpoint at `/credential/assertions/{learner-uuid}.json`.~~ **Done** — replaced by the claim-code flow (see "Claim-code flow" below). `vc_request_url` is now `https://teachplay.dev/api/claim?code=<code>`, which returns a freshly-signed VC on first redemption and 404s thereafter.
2. ~~Sign each VC with the issuer's Ed25519 key using `eddsa-rdfc-2022` over URDNA2015-canonicalized credential.~~ **Done.** Worker uses the same `@digitalbazaar/vc` pipeline as the CLI.
3. ~~Update `vc_request_url` to point at the per-learner path.~~ **Done** — the `/claim` page constructs the deep link with the live code.
4. ~~Add `auth_type=code` flow.~~ **Done via claim code** — the code itself is the authn, single-use and TTL-bounded. Swapping for real OAuth is still open but no longer blocking P1.

### P2 — VC 2.0 JSON download

The lowest-friction path. Works with any wallet that supports "add credential from file." The learner saves the JSON and imports it manually. Not elegant, but it removes the "we only work with LCW" failure mode.

**To productionize P2:** ~~sign the per-learner VC and serve it behind the same auth gate as P1.~~ **Done** — the Download button on `/claim?code=<code>` does a GET to `/api/claim?code=<code>` which returns the signed VC with `Content-Disposition: attachment`.

### P3 — OID4VCI offer

OID4VCI (OpenID for Verifiable Credential Issuance) is the emerging interop standard, backed by Microsoft (Entra Verified ID), the EU Digital Identity Wallet, and most of the post-2024 wallet ecosystem. The handoff is a two-step dance:

1. We publish an "offer" URL: `openid-credential-offer://?credential_offer=<json>`.
2. The wallet reads the offer, resolves the `credential_issuer`, and exchanges a pre-authorized code at the issuer's `/oid4vci/token` endpoint for the actual credential at `/oid4vci/credential`.

**To productionize P3:**

1. Expose `/.well-known/openid-credential-issuer` at `https://teachplay.dev/` with the issuer metadata (supported credential configurations, cryptographic suites, authorization endpoints).
2. Implement `/oid4vci/token` (pre-authorized code grant) and `/oid4vci/credential` (returns the signed VC).
3. ~~Store pre-authorized codes with a short TTL (5 min) and one-time semantics.~~ **Done** — the claim-code flow (CLAIM_CODES KV, `expirationTtl` + `delete`-on-redemption) is already the pre-authorized-code store. The `/claim` page embeds the code into an `openid-credential-offer://` URL today; only the `/oid4vci/token` ↔ `/oid4vci/credential` exchange remains.

This is the largest remaining build of the three. Recommended for cohort 2 once P1 + P2 have absorbed the first cohort.

## Claim-code flow

The bridge between "we issued a signed credential" and "the learner holds it in their wallet." Three endpoints on the Worker:

- `POST /api/claim-code` — admin-only (shares `ISSUER_API_KEY` with `/api/issue` and `/api/revoke`). Body is the same learner payload `/api/issue` takes, plus an optional `ttlSeconds`. Returns `{code, claimUrl, expiresAt}`. The code is `cl_` + 64 hex chars from `crypto.getRandomValues`. State lives in the `CLAIM_CODES` KV with `expirationTtl` so expired codes self-clean.
- `GET /claim?code=<code>` — public HTML landing page. Renders three handoff buttons with the code baked into each URL (`dccrequest://...`, `/api/claim?code=...`, `openid-credential-offer://...`). Rendering does **not** redeem the code — it can be opened as many times as needed until redemption or TTL.
- `GET|POST /api/claim` — public. Accepts the code in query, JSON body, or `Authorization: Bearer`. On success: `delete` from KV (one-shot independent of TTL), issue the VC through the same `src/lib/issue.js` path `/api/issue` uses, and return the signed VC as `application/ld+json` with a download-friendly `Content-Disposition`. On reuse / expired / unknown: 404 with no leaky detail.

Why bother instead of just exposing `/api/issue` to learners:

- **The issuer API key never touches a learner device.** A claim code is scoped to one learner payload and expires; leaking it burns one issuance, not the whole signer.
- **Distribution channel independence.** The admin can hand the code to the learner through any channel (LMS message, email, printed QR). Rotating channels does not touch the signer.
- **One-shot semantics** map onto OID4VCI's pre-authorized-code grant directly, so the same KV store becomes P3's code registry when `/oid4vci/token` is wired.

Known limits (documented; not blockers for P1/P2 but real):

- **No learner-DID binding yet.** `credentialSubject.id` is still `urn:uuid:<learner-id>`, not a wallet-provided DID. A wallet that expects the credential bound to *its* key material will accept it but lose the holder-binding property. Adding a DID-Auth step on redemption is the next refinement.
- **Claim-code mint still requires the admin key.** Real flow is LMS → Worker: an LTI 1.3 launch proves the learner's identity, the Worker mints a code bound to that learner, returns the `claimUrl` for the learner to visit. That replaces "admin curls `/api/claim-code`" with a verified flow.
- **Codes are opaque to observability.** The xAPI "wallet-handoff" statement fires on redemption, not mint, so mint-without-redeem (dropped links, wrong email) is invisible until we log mints separately.

## Issuer identity

In all three paths, the verifier needs to resolve the issuer's public key without contacting us. Two bindings are possible:

- **HTTPS Profile (legacy).** Issuer identity = `https://teachplay.dev/credential/issuer-v3.json`. Public key at a well-known path. Fine for classroom-demo verifiers; brittle if `teachplay.dev` goes offline.
- **`did:web` (current).** Issuer identity = `did:web:teachplay.dev`. The DID document at `.well-known/did.json` lists the `Multikey` verification method (Ed25519 public key, multibase-encoded). Cache-friendly; verifier can keep the public key after one fetch; survives issuer-domain churn better than bare HTTPS.

We ship `did:web` as of this revision. `issuer.id` in both `issuer-v3.json` and the assertion example has been updated from the HTTPS URL to `did:web:teachplay.dev`; the HTTPS URL is retained on the issuer profile as `alsoKnownAs` for cache-warm verifiers. Migration checklist:

- [x] Generate keypair (`tools/gen-keypair.mjs`).
- [x] Publish DID document at `.well-known/did.json`.
- [x] Update `issuer.id` → `did:web:teachplay.dev`.
- [x] Re-sign the example credential.
- [ ] Add `keyAgreement` section when we adopt encryption-at-rest for learner VCs (out of scope for scaffold).

## Signing pipeline

The example VC is signed end-to-end. The wiring:

1. **Keypair.** Ed25519 keypair at `tools/keys/issuer-ed25519.{private,public}.json`. The private key is gitignored (`tools/keys/*.private.json`); in production it moves to a secret store (AWS KMS / GCP Secret Manager / a hardware token on the signing box) and never touches the filesystem of a web-accessible host.
2. **DID document.** `.well-known/did.json` publishes the issuer's verification method as a `Multikey` entry under `did:web:teachplay.dev`. Verifiers resolve the DID (`https://teachplay.dev/.well-known/did.json`), match `verificationMethod`, and check the signature without contacting any teachplay.dev application endpoint.
3. **Canonicalization.** URDNA2015 (JSON-LD canonical form) over the credential minus the `proof` field. The `@digitalbazaar/eddsa-rdfc-2022-cryptosuite` implementation handles canonicalization and hashing.
4. **Signing.** Ed25519 signature over the hashed canonical form; the `DataIntegrityProof` is attached with `proofPurpose: assertionMethod`.
5. **Verification test.** `npm run verify:example` re-canonicalizes and re-checks on every run; a red build means the proof, the DID binding, or the context set drifted.

Operational commands:

```
npm run keygen              # regenerate the issuer keypair (--force to overwrite)
npm run sign:example        # sign the unsigned template → assertion-example-v3.json
npm run verify:example      # round-trip verify the signed example
npm run issue:learner -- \
  --id <learner-id> \
  [--email <addr>]  \
  [--name "Display Name"] \
  [--cohort 2026-spring] \
  [--valid-from 2026-05-02T00:00:00Z]
                            # issue a signed per-learner VC into credential/assertions/<id>.json
```

The per-learner issuance step reuses the same signing suite as the example and writes to `credential/assertions/`, which is gitignored — real learner credentials never land in the public repo. A browser-side structural verifier (`credential.html#verify`) checks issuer, validity window, vm-in-DID-doc, and OBv3 type membership; the cryptographic check (eddsa-rdfc-2022 over URDNA2015) still runs in the wallet or via `tools/verify-vc.mjs` because the canonicalization libraries are too heavy to ship to the browser.

Library versions in `package.json`: `@digitalbazaar/vc`, `@digitalbazaar/ed25519-multikey`, `@digitalbazaar/eddsa-rdfc-2022-cryptosuite`, `@digitalbazaar/data-integrity`, `jsonld`. DCC's `@digitalcredentials/vc` is a drop-in alternative; `didkit` (Rust) is the interop reference when verifiers disagree.

The signing step runs in a background worker in production, not in the request path — signing takes ~200ms on a single credential and must not block the portfolio upload flow.

### Note on `validFrom`

The example credential has `validFrom: 2026-05-02` — after the cohort end date — so a naive verifier run before that date will (correctly) report the credential not-yet-valid. The `verify-vc.mjs` helper short-circuits this for pre-flight testing by clocking verification against the credential's own `validFrom`; pass `--now=<ISO>` to override. Production verifiers will use real wall-clock time.

## Revocation

Implemented in scaffold.

- **BitstringStatusList** credential (W3C VC Status List, the successor to StatusList2021) published at `https://teachplay.dev/credential/status-list-2026-spring.json`. The list itself is a signed `VerifiableCredential` + `BitstringStatusListCredential`; the bitstring is a 131,072-bit buffer, GZIP-compressed and base64url-encoded with a `u` multibase prefix.
- Each issued VC carries `credentialStatus.type = "BitstringStatusListEntry"` with a `statusListIndex` allocated at issuance. Allocation is tracked in `credential/status-list-registry.json` (index, learner id, purpose) so revocation is idempotent and the same learner re-issued does not collide.
- CLI: `node tools/status-list.mjs {init|allocate|revoke|reinstate|check|info}`. `issue-for-learner.mjs` calls `allocate` automatically unless `--no-status` is passed.
- Verifiers: `verify-vc.mjs` decodes the bitstring and reports `valid` vs `REVOKED` alongside the cryptographic check. The browser verifier in `credential.html` does the same using `DecompressionStream('gzip')`.
- Revocation happens when the credential engine / registrar explicitly requests it, not automatically. Renaming the cohort or changing the rubric does not revoke.

## Endorsement layer

Implemented in scaffold.

- **OBv3 `EndorsementCredential`**: a separate third party signs an attestation that references our BadgeClass (or an individual learner's assertion). The endorser signs under their **own** DID — `did:web:teachplay.dev:endorsers:<slug>` — with a **separate Ed25519 keypair** from the issuer's. This is the whole point: a verifier can tell Tuscaloosa City Schools' claim apart from ours because the two signatures anchor to different DIDs.
- Tooling: `tools/gen-endorser-key.mjs --slug <slug> --name "<Org>"` scaffolds the keypair, DID document, and OBv3 Profile. `tools/sign-endorsement.mjs --endorser <slug>` signs `credential/endorsement-template-v3.json` and writes to `credential/endorsements/<slug>-template-v3.json`.
- `verify-vc.mjs`'s documentLoader resolves any path-based `did:web:teachplay.dev:endorsers:*` DID from the local filesystem, so endorsement credentials round-trip through the same verifier as issuer credentials without special-casing.
- Demo artifact: `credential/endorsements/tcs-template-v3.json` (Tuscaloosa City Schools). Rendered live under `credential.html#endorsement`.

## Observability

Each handoff action emits an xAPI `experienced` statement against `obj('wallet-handoff', <path>, ...)`. This gives us:

- **Uptake per path.** Is anyone actually using OID4VCI yet? If not, retire P3 or recruit testers.
- **Drop-off.** Learners who earn the credential but never trigger a handoff — the credential hasn't landed. Analytics should surface this as a retention metric.
- **Wallet mix.** The sequence of handoff attempts per learner (DCC first, then download) tells us which default to keep.

Statements are queue-local in the scaffold; on the LRS in production.

## Honest limits

- **The example is a demonstration, not an issued credential.** The signed example at `credential/assertion-example-v3.json` has a real signature, but the subject `did:example:learner-0001` is a placeholder. Any verifier running a real check will confirm the signature and issuer — but should not treat the subject as a real person. The production issuance endpoint binds each VC to a learner-controlled subject identifier before signing.
- **Cross-wallet interop is not uniform.** Even with OID4VCI in play, wallets disagree on how to display multi-achievement credentials, how to surface evidence URLs, and whether ESCO/Lightcast alignments are readable in-wallet. This is where the ecosystem pain currently lives.
- **`did:web` is not a real decentralized identifier.** It inherits DNS trust; if `teachplay.dev` is compromised, the DID is compromised. It is a pragmatic choice for institutional issuers, not an ideological one.

## Estimate

- ~~Signing pipeline~~: **done** — `npm run sign:example` / `npm run verify:example`.
- ~~`did:web` migration~~: **done** — `.well-known/did.json` published, issuer rebound.
- ~~Per-learner issuance (CLI)~~: **done** — `npm run issue:learner -- --id <id> --email <addr>` writes to `credential/assertions/`. Remaining: gated HTTP route + signing worker (~1.5 engineer-days).
- ~~Revocation (BitstringStatusList)~~: **done** — `tools/status-list.mjs` + allocation in `issue-for-learner.mjs` + decode in both `verify-vc.mjs` and `credential.html`.
- ~~Endorsement layer (OBv3)~~: **done** — `tools/gen-endorser-key.mjs` + `tools/sign-endorsement.mjs` + `credential/endorsements/tcs-template-v3.json`.
- OID4VCI endpoint (P3 productionization): ~2 engineer-weeks.

Remaining work is roughly two engineer-weeks. The hard part is not the code — it is walking one real learner through P1 end-to-end with a live wallet and watching what breaks.

---

Referenced by:

- `credential.html#wallet` — the three handoff cards and the details drawer.
- `docs/L1-credential-engine-registration.md` — CTDL registration expects the credential to be handoff-capable.
