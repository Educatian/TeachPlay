/**
 * POST /api/issue — sign a real per-learner credential.
 *
 * Accepts a learner payload, loads the canonical unsigned template from
 * the bound static assets, customizes the subject / evidence / identity-
 * hash fields (parity with tools/issue-for-learner.mjs), allocates a
 * fresh index in the cohort's BitstringStatusList (KV), injects a
 * credentialStatus entry, and signs under the issuer key held in
 * ISSUER_PRIVATE_KEY_JSON.
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
 *     "validFrom":"2026-05-02T00:00:00Z", // optional, default now()
 *     "noStatus": false                   // optional, true skips credentialStatus
 *   }
 *
 * Response (200):
 *   { "ok": true, "signed": <signed VC>, "statusIndex": 0 }
 *
 * Known limits:
 *   - Status index allocation is a KV read + write, not atomic. Two
 *     simultaneous issuances can read the same "next" and collide on
 *     one index. See src/lib/status-list.js. Production needs a
 *     Durable Object or D1 row-level update.
 *   - No idempotency. Calling /api/issue twice for the same learner id
 *     produces two distinct signatures and burns two status indexes.
 */
import { signCredential } from '../lib/sign.js';
import {
  allocateIndex,
  buildStatusEntry,
  DEFAULT_BITSTRING_SIZE,
} from '../lib/status-list.js';

const ID_PATTERN = /^[a-zA-Z0-9_-]{2,64}$/;
const COHORT_PATTERN = /^[a-z0-9-]{2,32}$/;
const TEMPLATE_PATH = '/credential/assertion-example-v3.unsigned.json';

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

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

function customize(template, { id, name, cohort, validFrom, statusEntry }, identityHash) {
  const c = JSON.parse(JSON.stringify(template));
  c.id = `https://teachplay.dev/credential/assertions-v3/${id}.json`;
  c.validFrom = validFrom;
  delete c.proof;
  delete c._proof_note;

  if (statusEntry) c.credentialStatus = statusEntry;
  else delete c.credentialStatus;

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
      hint: 'POST JSON: {id, email?, name?, cohort?, validFrom?, noStatus?} with Authorization: Bearer <ISSUER_API_KEY>',
    }, 405);
  }

  const auth = checkAuth(request, env);
  if (!auth.ok) return json(auth.body, auth.code);

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
  const noStatus = !!body.noStatus;

  let statusIndex = null;
  let statusEntry = null;
  if (!noStatus) {
    try {
      statusIndex = await allocateIndex(env, cohort, DEFAULT_BITSTRING_SIZE);
      statusEntry = buildStatusEntry(cohort, statusIndex);
    } catch (e) {
      return json({ error: 'Status index allocation failed', message: e.message }, 500);
    }
  }

  let template;
  try { template = await fetchTemplate(request, env); }
  catch (e) { return json({ error: 'Failed to load template', message: e.message }, 500); }

  const identityHash = email ? await sha256Hex(cohort + email) : null;
  const credential = customize(
    template,
    { id, name, cohort, validFrom, statusEntry },
    identityHash
  );

  try {
    const signed = await signCredential(credential, env);
    return json({ ok: true, signed, statusIndex });
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
