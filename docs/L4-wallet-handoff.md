# L4 · Wallet handoff — design note

Design-only. This document specifies how a learner's verified `OpenBadgeCredential` (OBv3 / VC 2.0) leaves `teachplay.dev` and lands inside a wallet the learner controls — a DCC Learner Credential Wallet (LCW), a generic OID4VCI-conformant wallet, or a plain file on disk for fallback. It is written so that (a) a production engineer can wire the signing pipeline without re-deriving the protocol choices, and (b) a reviewer can see which parts of the scaffold are load-bearing and which are placeholders.

Status: **signing pipeline live; per-learner issuance endpoint and OID4VCI issuer endpoint remain to build**. Three handoff paths are live on `credential.html#wallet`, each emitting an `experienced` xAPI statement so uptake is measurable. The example VC at `credential/assertion-example-v3.json` is now signed with a real Ed25519 Data Integrity proof (`eddsa-rdfc-2022`) bound to `did:web:teachplay.dev`, and verifies end-to-end via `npm run verify:example`. The unsigned template is kept alongside it at `credential/assertion-example-v3.unsigned.json` for re-signing.

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

1. Stand up a per-learner endpoint at `/credential/assertions/{learner-uuid}.json` that returns the VC for the authenticated learner only.
2. Sign each VC with the issuer's Ed25519 key using `eddsa-rdfc-2022` over URDNA2015-canonicalized credential.
3. Update `vc_request_url` to point at the per-learner path rather than the static example.
4. Add `auth_type=code` flow: redirect back through an OAuth code exchange so we don't serve the VC to anyone with the URL.

### P2 — VC 2.0 JSON download

The lowest-friction path. Works with any wallet that supports "add credential from file." The learner saves the JSON and imports it manually. Not elegant, but it removes the "we only work with LCW" failure mode.

**To productionize P2:** sign the per-learner VC and serve it behind the same auth gate as P1.

### P3 — OID4VCI offer

OID4VCI (OpenID for Verifiable Credential Issuance) is the emerging interop standard, backed by Microsoft (Entra Verified ID), the EU Digital Identity Wallet, and most of the post-2024 wallet ecosystem. The handoff is a two-step dance:

1. We publish an "offer" URL: `openid-credential-offer://?credential_offer=<json>`.
2. The wallet reads the offer, resolves the `credential_issuer`, and exchanges a pre-authorized code at the issuer's `/oid4vci/token` endpoint for the actual credential at `/oid4vci/credential`.

**To productionize P3:**

1. Expose `/.well-known/openid-credential-issuer` at `https://teachplay.dev/` with the issuer metadata (supported credential configurations, cryptographic suites, authorization endpoints).
2. Implement `/oid4vci/token` (pre-authorized code grant) and `/oid4vci/credential` (returns the signed VC).
3. Store pre-authorized codes with a short TTL (5 min) and one-time semantics.

This is the largest build of the three. Recommended for cohort 2 once P1 + P2 have absorbed the first cohort.

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
npm run keygen          # regenerate the issuer keypair (--force to overwrite)
npm run sign:example    # sign the unsigned template → assertion-example-v3.json
npm run verify:example  # round-trip verify the signed example
```

Library versions in `package.json`: `@digitalbazaar/vc`, `@digitalbazaar/ed25519-multikey`, `@digitalbazaar/eddsa-rdfc-2022-cryptosuite`, `@digitalbazaar/data-integrity`, `jsonld`. DCC's `@digitalcredentials/vc` is a drop-in alternative; `didkit` (Rust) is the interop reference when verifiers disagree.

The signing step runs in a background worker in production, not in the request path — signing takes ~200ms on a single credential and must not block the portfolio upload flow.

### Note on `validFrom`

The example credential has `validFrom: 2026-05-02` — after the cohort end date — so a naive verifier run before that date will (correctly) report the credential not-yet-valid. The `verify-vc.mjs` helper short-circuits this for pre-flight testing by clocking verification against the credential's own `validFrom`; pass `--now=<ISO>` to override. Production verifiers will use real wall-clock time.

## Revocation

Out of scope for scaffold; must exist for production.

- **StatusList2021** credential published at `https://teachplay.dev/credential/status-list-2026.json`. Each issued VC carries a `credentialStatus.statusListIndex` position.
- A revoked credential is marked by flipping the bit at its index. The status list itself is a small VC that the verifier fetches once and caches.
- Revocation happens when the credential engine / registrar explicitly requests it, not automatically. Renaming the cohort or changing the rubric does not revoke.

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
- Per-learner issuance endpoint (auth + signing worker): ~3 engineer-days.
- OID4VCI endpoint (P3 productionization): ~2 engineer-weeks.
- Revocation (StatusList2021): ~3 engineer-days.

Remaining work is roughly two and a half engineer-weeks. The hard part is not the code — it is walking one real learner through P1 end-to-end with a live wallet and watching what breaks.

---

Referenced by:

- `credential.html#wallet` — the three handoff cards and the details drawer.
- `docs/L1-credential-engine-registration.md` — CTDL registration expects the credential to be handoff-capable.
