/**
 * GET /api/sign-test — signing compatibility smoketest.
 *
 * Answers the single question we need answered before promoting any real
 * endpoint: does @digitalbazaar/vc (with its jsonld / data-integrity /
 * ed25519-multikey dep chain) actually run inside a Workers V8 isolate
 * with nodejs_compat, or do we need to drop to @noble/ed25519 + a manual
 * RDFC canonicalizer?
 *
 * Signs a fixed minimal credential under the issuer key loaded from the
 * ISSUER_PRIVATE_KEY_JSON secret. The subject is a placeholder, so the
 * endpoint is safe to leave public during the smoketest phase.
 *
 * Requires:
 *   - wrangler.toml compatibility_flags includes "nodejs_compat".
 *   - Dashboard / `wrangler secret put` has set ISSUER_PRIVATE_KEY_JSON
 *     to the full JSON of tools/keys/issuer-ed25519.private.json.
 */
import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';
import { cryptosuite as eddsaRdfc2022 } from '@digitalbazaar/eddsa-rdfc-2022-cryptosuite';
import { DataIntegrityProof } from '@digitalbazaar/data-integrity';
import * as vc from '@digitalbazaar/vc';
import { contexts as vcContexts } from '@digitalbazaar/credentials-context';

// Workers have no filesystem and no jsonld doc cache. We resolve @context
// locally whenever we can (W3C VC v1/v2, undefined-terms-v2 — all
// bundled with @digitalbazaar/credentials-context) and fall back to
// fetch only for contexts we haven't embedded. Fetching www.w3.org at
// sign time is also fragile: content negotiation sometimes returns HTML
// which fails jsonld.InvalidUrl, so the local map is the safer path.
const embeddedContexts = new Map(vcContexts);

const documentLoader = async (url) => {
  if (embeddedContexts.has(url)) {
    return {
      documentUrl: url,
      document: embeddedContexts.get(url),
      contextUrl: null,
    };
  }
  const res = await fetch(url, {
    headers: { accept: 'application/ld+json, application/json' },
  });
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

export async function handleSignTest(request, env, ctx) {
  const raw = env.ISSUER_PRIVATE_KEY_JSON;
  if (!raw) return json({ error: 'ISSUER_PRIVATE_KEY_JSON not set on this Worker deployment' }, 500);

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
    credentialSubject: { id: 'did:example:worker-smoketest' },
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
}
