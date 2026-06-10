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
 * Revocation is a single idempotent D1 row write (INSERT OR IGNORE to
 * revoke, DELETE to reinstate) via setRevocation, so concurrent revokes
 * of different indexes can no longer clobber each other the way the old
 * KV read-modify-write bitstring could.
 *
 * Does NOT allocate an index (revocation only flips an already-issued one).
 */
import { setRevocation, DEFAULT_BITSTRING_SIZE } from '../lib/status-list.js';
import { checkAdminAuth } from '../lib/auth.js';

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

export async function handleRevoke(request, env, ctx) {
  if (request.method !== 'POST') {
    return json({
      error: 'Method Not Allowed',
      hint: 'POST JSON: {cohort?, index, value?} with Authorization: Bearer <ISSUER_API_KEY>',
    }, 405);
  }

  const auth = checkAdminAuth(request, env);
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
    // Atomic single-row INSERT/DELETE in D1 — no read-modify-write race.
    const previous = await setRevocation(env, cohort, index, value, {});
    return json({ ok: true, cohort, index, previous, current: value });
  } catch (e) {
    console.error('revoke failed', e);
    return json({ ok: false, error: 'Revoke failed' }, 500);
  }
}
