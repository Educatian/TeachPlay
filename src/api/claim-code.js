/**
 * POST /api/claim-code — mint a one-time claim code for wallet handoff.
 *
 * Admin-gated (ISSUER_API_KEY). The returned code is given to the
 * learner out-of-band (LMS message, email, QR); the learner then
 * redeems it at /api/claim (or from /claim?code=... in a browser) to
 * receive their signed credential in a wallet of their choice.
 *
 * Why a claim code instead of just calling /api/issue?
 *   - /api/issue requires the shared admin key, which must never touch
 *     a learner device or a wallet.
 *   - A claim code is single-use, short-lived (TTL), and bound at mint
 *     time to one learner payload, so leaking it only burns one
 *     issuance — the issuer key stays off the learner path entirely.
 *
 * Request body (JSON): same shape as /api/issue
 *   { id, email?, name?, cohort?, validFrom?, noStatus?, ttlSeconds? }
 *
 * Response (200):
 *   {
 *     "ok": true,
 *     "code": "cl_<64 hex>",
 *     "claimUrl": "https://teachplay.dev/claim?code=cl_...",
 *     "expiresAt": "2026-04-19T..."
 *   }
 */
import { normalizeLearnerPayload } from '../lib/issue.js';
import { checkAdminAuth } from '../lib/auth.js';

const DEFAULT_TTL_SECONDS = 3600;          // 1 hour
const MAX_TTL_SECONDS = 7 * 24 * 3600;     // 1 week — long enough for email flows, short enough to bound exposure

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function randomCode() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
  return 'cl_' + hex;
}

export async function handleClaimCode(request, env, ctx) {
  if (request.method !== 'POST') {
    return json({
      error: 'Method Not Allowed',
      hint: 'POST JSON: {id, email?, name?, cohort?, validFrom?, noStatus?, ttlSeconds?} with Authorization: Bearer <ISSUER_API_KEY>',
    }, 405);
  }

  const auth = checkAdminAuth(request, env);
  if (!auth.ok) return json(auth.body, auth.code);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, 400); }

  const parsed = normalizeLearnerPayload(body);
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  let ttl = Number(body.ttlSeconds);
  if (!Number.isFinite(ttl) || ttl <= 0) ttl = DEFAULT_TTL_SECONDS;
  if (ttl > MAX_TTL_SECONDS) ttl = MAX_TTL_SECONDS;
  if (ttl < 60) ttl = 60; // Workers KV minimum expiration_ttl

  const code = randomCode();
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

  const payload = {
    ...parsed.value,
    mintedAt: new Date().toISOString(),
    expiresAt,
  };

  await env.CLAIM_CODES.put(code, JSON.stringify(payload), { expirationTtl: ttl });

  const origin = new URL(request.url).origin;
  return json({
    ok: true,
    code,
    claimUrl: `${origin}/claim?code=${code}`,
    expiresAt,
  });
}
