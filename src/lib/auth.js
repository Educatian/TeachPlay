/**
 * Shared admin-key auth for the teachplay Worker.
 *
 * Three admin endpoints (/api/issue, /api/revoke, /api/claim-code) all
 * gate on the same `ISSUER_API_KEY` secret with the same constant-time
 * comparison. Keeping that in one place means a change to the auth
 * check (rotating header names, adding rate-limit context, swapping
 * for mTLS) is a one-file change.
 *
 * Public endpoints (/api/claim, /api/status-list/<cohort>,
 * /api/health) do not use this — they have their own authorization
 * model (one-time code, or none at all).
 */

// Constant-time string compare after a length check. Prevents the
// early-exit timing channel a naive `a === b` would expose.
export function timingSafeEqualStr(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Returns {ok: true} on a valid shared-secret match, or
// {ok: false, code, body} the caller can pass straight to `json()`.
export function checkAdminAuth(request, env) {
  const expected = env.ISSUER_API_KEY;
  if (!expected) {
    return { ok: false, code: 500, body: { error: 'ISSUER_API_KEY not set on this Worker' } };
  }
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  const provided = match ? match[1] : (request.headers.get('x-api-key') || '');
  if (!timingSafeEqualStr(provided, expected)) {
    return { ok: false, code: 401, body: { error: 'Unauthorized' } };
  }
  return { ok: true };
}
