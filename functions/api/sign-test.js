/**
 * Cloudflare Pages Function — signing compatibility smoketest.
 *
 * The question this endpoint answers: does @digitalbazaar/vc actually run
 * inside a Workers runtime (V8 isolate with nodejs_compat), or do we need
 * to drop to a thinner primitive (e.g. @noble/ed25519 + manual RDFC)?
 *
 * It signs a minimal hardcoded VerifiableCredential under the issuer key
 * held in the ISSUER_PRIVATE_KEY_JSON secret, using the same suite as the
 * CLI tools (eddsa-rdfc-2022). If this returns a signed VC, the whole
 * signing stack works on Pages Functions and we can build real endpoints
 * (issue-for-learner, revoke) on top.
 *
 * Route: POST /api/sign-test   (GET also accepted for convenience)
 *
 * Requires:
 *   - Pages compatibility flag `nodejs_compat` (Dashboard → Settings →
 *     Functions → Compatibility flags, or wrangler.toml).
 *   - Secret `ISSUER_PRIVATE_KEY_JSON` — the JSON contents of
 *     tools/keys/issuer-ed25519.private.json, pasted as one string.
 */
import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';
import { cryptosuite as eddsaRdfc2022 } from '@digitalbazaar/eddsa-rdfc-2022-cryptosuite';
import { DataIntegrityProof } from '@digitalbazaar/data-integrity';
import * as vc from '@digitalbazaar/vc';

// Workers have no filesystem, so we resolve every @context / DID over
// fetch. www.w3.org and w3id.org are CDN-cached, so latency is fine for
// a smoketest; production endpoints should embed the small set of static
// contexts we use to avoid the network hop.
const documentLoader = async (url) => {
  const res = await fetch(url, { headers: { accept: 'application/ld+json, application/json' } });
  if (!res.ok) throw new Error(`documentLoader: ${url} → HTTP ${res.status}`);
  const document = await res.json();
  return { documentUrl: url, document, contextUrl: null };
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export const onRequest = async (context) => {
  const raw = context.env.ISSUER_PRIVATE_KEY_JSON;
  if (!raw) return json({ error: 'ISSUER_PRIVATE_KEY_JSON not set on this Pages deployment' }, 500);

  let keyPair;
  try {
    keyPair = await Ed25519Multikey.from(JSON.parse(raw));
  } catch (e) {
    return json({ error: 'Failed to load key', message: e.message }, 500);
  }

  const credential = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    id: `urn:uuid:${crypto.randomUUID()}`,
    type: ['VerifiableCredential'],
    issuer: { id: 'did:web:teachplay.dev' },
    validFrom: new Date().toISOString(),
    credentialSubject: { id: 'did:example:pages-functions-smoketest' },
  };

  try {
    const suite = new DataIntegrityProof({ signer: keyPair.signer(), cryptosuite: eddsaRdfc2022 });
    const signed = await vc.issue({ credential, suite, documentLoader });
    return json({ ok: true, signed });
  } catch (e) {
    return json({
      ok: false,
      error: 'vc.issue failed',
      name: e.name,
      message: e.message,
      stack: e.stack?.split('\n').slice(0, 8).join('\n'),
    }, 500);
  }
};
