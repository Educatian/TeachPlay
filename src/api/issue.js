/**
 * POST /api/issue — sign a real per-learner credential.
 *
 * Supersedes /api/sign-test. Accepts a learner payload, loads the
 * canonical unsigned template from the bound static assets, customizes
 * the subject / evidence / identity-hash fields (parity with
 * tools/issue-for-learner.mjs), and signs under the issuer key held in
 * the ISSUER_PRIVATE_KEY_JSON secret.
 *
 * Auth: `Authorization: Bearer <ISSUER_API_KEY>` (or `X-API-Key` header).
 *       The comparison is length-checked then constant-time.
 *
 * Request body (JSON):
 *   {
 *     "id":       "7f3c1e9a",            // required, [a-zA-Z0-9_-]{2,64}
 *     "email":    "learner@example.edu",  // optional → hashed into identifier
 *     "name":     "Ada L.",               // optional → shown as subject.name
 *     "cohort":   "2026-spring",          // optional, default "2026-spring"
 *     "validFrom":"2026-05-02T00:00:00Z"  // optional, default now()
 *   }
 *
 * Response (200):
 *   { "ok": true, "signed": <signed VC> }
 *
 * What this *does not* yet do (deferred to the next layers):
 *   - credentialStatus (BitstringStatusList). Allocating an index from
 *     the Worker requires writable persistence (Cloudflare KV); until
 *     then, issued credentials carry no revocation hook. Revocation
 *     still works for credentials issued via the CLI pipeline.
 *   - Idempotency. Calling /api/issue twice for the same learner id
 *     produces two distinct signatures. Real production flow should
 *     dedupe or version per-learner issuances.
 */
import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';
import { cryptosuite as eddsaRdfc2022 } from '@digitalbazaar/eddsa-rdfc-2022-cryptosuite';
import { DataIntegrityProof } from '@digitalbazaar/data-integrity';
import * as vc from '@digitalbazaar/vc';
import { contexts as vcContexts } from '@digitalbazaar/credentials-context';

const ID_PATTERN = /^[a-zA-Z0-9_-]{2,64}$/;
const COHORT_PATTERN = /^[a-z0-9-]{2,32}$/;
const TEMPLATE_PATH = '/credential/assertion-example-v3.unsigned.json';

const embeddedContexts = new Map(vcContexts);

const documentLoader = async (url) => {
  if (embeddedContexts.has(url)) {
    return { documentUrl: url, document: embeddedContexts.get(url), contextUrl: null };
  }
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

// Constant-time string compare over the shorter-of-two lengths, with a
// final length check. Prevents the early-exit timing channel that a naive
// `a === b` would expose.
function timingSafeEqualStr(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function checkAuth(request, env) {
  const expected = env.ISSUER_API_KEY;
  if (!expected) return { ok: false, code: 500, body: { error: 'ISSUER_API_KEY not set on this Worker' } };
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  const provided = match ? match[1] : (request.headers.get('x-api-key') || '');
  if (!timingSafeEqualStr(provided, expected)) {
    return { ok: false, code: 401, body: { error: 'Unauthorized' } };
  }
  return { ok: true };
}

async function sha256Hex(s) {
  const bytes = new TextEncoder().encode(s);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function fetchTemplate(request, env) {
  const url = new URL(request.url);
  url.pathname = TEMPLATE_PATH;
  url.search = '';
  const res = await env.ASSETS.fetch(new Request(url.toString()));
  if (!res.ok) throw new Error(`Template fetch (${TEMPLATE_PATH}) → HTTP ${res.status}`);
  return res.json();
}

function customize(template, { id, name, cohort, validFrom }, identityHash) {
  const c = JSON.parse(JSON.stringify(template));
  c.id = `https://teachplay.dev/credential/assertions-v3/${id}.json`;
  c.validFrom = validFrom;
  delete c.proof;
  delete c._proof_note;

  const subj = c.credentialSubject;
  subj.id = `urn:uuid:${id}`;
  if (name) subj.name = name;

  if (identityHash) {
    subj.identifier = [{
      type: 'IdentityObject',
      identityHash: 'sha256$' + identityHash,
      identityType: 'emailAddress',
      hashed: true,
      salt: cohort,
    }];
  } else {
    delete subj.identifier;
  }

  if (Array.isArray(c.evidence)) {
    for (const ev of c.evidence) {
      if (ev.id && typeof ev.id === 'string') {
        ev.id = ev.id
          .replace(/\/cohort\/[^/]+\//, `/cohort/${cohort}/`)
          .replace(/\/portfolios\/[^/]+\//, `/portfolios/${id}/`);
      }
    }
  }

  return c;
}

export async function handleIssue(request, env, ctx) {
  if (request.method !== 'POST') {
    return json({
      error: 'Method Not Allowed',
      hint: 'POST JSON: {id, email?, name?, cohort?, validFrom?} with Authorization: Bearer <ISSUER_API_KEY>',
    }, 405);
  }

  const auth = checkAuth(request, env);
  if (!auth.ok) return json(auth.body, auth.code);

  if (!env.ISSUER_PRIVATE_KEY_JSON) {
    return json({ error: 'ISSUER_PRIVATE_KEY_JSON not set on this Worker' }, 500);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, 400); }

  const id = body.id;
  if (!id || !ID_PATTERN.test(id)) {
    return json({ error: '`id` is required and must match [a-zA-Z0-9_-]{2,64}' }, 400);
  }
  const cohort = body.cohort || '2026-spring';
  if (!COHORT_PATTERN.test(cohort)) {
    return json({ error: '`cohort` must match [a-z0-9-]{2,32}' }, 400);
  }
  const name = body.name ? String(body.name) : null;
  const email = body.email ? String(body.email).trim().toLowerCase() : null;
  const validFrom = body.validFrom || new Date().toISOString();

  let keyPair;
  try {
    keyPair = await Ed25519Multikey.from(JSON.parse(env.ISSUER_PRIVATE_KEY_JSON));
  } catch (e) {
    return json({ error: 'Failed to load issuer key', message: e.message }, 500);
  }

  let template;
  try { template = await fetchTemplate(request, env); }
  catch (e) { return json({ error: 'Failed to load template', message: e.message }, 500); }

  const identityHash = email ? await sha256Hex(cohort + email) : null;
  const credential = customize(template, { id, name, cohort, validFrom }, identityHash);

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
