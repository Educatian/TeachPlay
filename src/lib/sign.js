/**
 * Shared signing helpers for the teachplay Worker.
 *
 * Both /api/issue (learner VCs) and /api/status-list/<cohort>
 * (BitstringStatusListCredential) need to (a) resolve JSON-LD contexts
 * without hitting the network for the ones we care about, and (b) load
 * the issuer key from `ISSUER_PRIVATE_KEY_JSON` and sign with the
 * eddsa-rdfc-2022 cryptosuite. Keeping that in one module avoids two
 * drifting copies and makes "how do we sign" a single-file question.
 *
 * The documentLoader is embedded-first: @digitalbazaar/credentials-context
 * ships v1/v2/undefined-terms-v2 inline, and we prefer them so the
 * critical path never depends on www.w3.org returning JSON-LD (it has
 * historically returned HTML under some content negotiations). Unknown
 * contexts fall through to a network fetch.
 */
import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';
import { cryptosuite as eddsaRdfc2022 } from '@digitalbazaar/eddsa-rdfc-2022-cryptosuite';
import { DataIntegrityProof } from '@digitalbazaar/data-integrity';
import * as vc from '@digitalbazaar/vc';
import { contexts as vcContexts } from '@digitalbazaar/credentials-context';

const embeddedContexts = new Map(vcContexts);

export const documentLoader = async (url) => {
  if (embeddedContexts.has(url)) {
    return { documentUrl: url, document: embeddedContexts.get(url), contextUrl: null };
  }
  const res = await fetch(url, { headers: { accept: 'application/ld+json, application/json' } });
  if (!res.ok) throw new Error(`documentLoader: ${url} → HTTP ${res.status}`);
  const document = await res.json();
  return { documentUrl: url, document, contextUrl: null };
};

export async function loadIssuerKey(env) {
  if (!env.ISSUER_PRIVATE_KEY_JSON) {
    throw new Error('ISSUER_PRIVATE_KEY_JSON not set on this Worker');
  }
  return Ed25519Multikey.from(JSON.parse(env.ISSUER_PRIVATE_KEY_JSON));
}

export async function signCredential(credential, env) {
  const keyPair = await loadIssuerKey(env);
  const suite = new DataIntegrityProof({
    signer: keyPair.signer(),
    cryptosuite: eddsaRdfc2022,
  });
  return vc.issue({ credential, suite, documentLoader });
}
