/**
 * POST /api/revoke — flip a BitstringStatusList bit to revoke a credential.
 *
 * Auth: `Authorization: Bearer <ISSUER_API_KEY>` (or `X-API-Key`). Same
 * shared secret as /api/issue — any caller that can issue can revoke.
 *
 * Request body (JSON):
 *   {
 *     "cohort": "2026-spring",  // optional, default "2026-spring"
 *     "index":  0,              // required, integer ≥ 0
 *     "value":  1               // optional, 1 = revoke (default), 0 = reinstate
 *   }
 *
 * Response (200):
 *   { "ok": true, "cohort": "...", "index": 0, "previous": 0, "current": 1 }
 *
 * The bit write is a KV get → mutate → put. Workers KV offers no
 * compare-and-swap, so two concurrent revocations targeting *different*
 * indexes in the same cohort can race and one write may clobber the
 * other. Acceptable for demo scale; production would use a Durable
 * Object singleton per cohort or D1 with a row-level lock.
 *
 * Does NOT touch STATUS_INDEX (revocation does not allocate an index).
 */
import { readBits, writeBits, getBit, setBit, DEFAULT_BITSTRING_SIZE } from '../lib/status-list.js';

const COHORT_PATTERN = /^[a-z0-9-]{2,32}$/;

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

export async function handleRevoke(request, env, ctx) {
  if (request.method !== 'POST') {
    return json({
      error: 'Method Not Allowed',
      hint: 'POST JSON: {cohort?, index, value?} with Authorization: Bearer <ISSUER_API_KEY>',
    }, 405);
  }

  const auth = checkAuth(request, env);
  if (!auth.ok) return json(auth.body, auth.code);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, 400); }

  const cohort = body.cohort || '2026-spring';
  if (!COHORT_PATTERN.test(cohort)) {
    return json({ error: '`cohort` must match [a-z0-9-]{2,32}' }, 400);
  }
  const index = Number(body.index);
  if (!Number.isInteger(index) || index < 0 || index >= DEFAULT_BITSTRING_SIZE) {
    return json({ error: `\`index\` must be an integer in [0, ${DEFAULT_BITSTRING_SIZE})` }, 400);
  }
  const value = body.value == null ? 1 : (body.value ? 1 : 0);

  try {
    const bits = await readBits(env, cohort, DEFAULT_BITSTRING_SIZE);
    const previous = getBit(bits, index);
    setBit(bits, index, value);
    await writeBits(env, cohort, bits);
    return json({ ok: true, cohort, index, previous, current: value });
  } catch (e) {
    return json({ ok: false, error: 'Revoke failed', message: e.message }, 500);
  }
}
