/**
 * GET /api/email-verify?t=<token> — redeem a one-time email claim token.
 *
 * Looks up the token in CLAIMS_KV, issues + signs the credential,
 * marks the token as used (so the link is truly one-time), and
 * returns the signed VC JSON to the browser.
 *
 * Response (200):
 *   { "ok": true, "signed": <VC>, "name": "Ada L.", "id": "<uuid>" }
 */
import { issueCredential } from '../lib/issue.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export async function handleEmailVerify(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get('t');

  if (!token)        return json({ error: 'Missing token' }, 400);
  if (!env.CLAIMS_KV) return json({ error: 'KV store not configured' }, 500);

  const raw = await env.CLAIMS_KV.get(`claim:${token}`);
  if (!raw) return json({ error: 'Token not found or expired' }, 404);

  let claim;
  try { claim = JSON.parse(raw); }
  catch { return json({ error: 'Malformed claim record' }, 500); }

  if (claim.used) return json({ error: 'This link has already been used.' }, 409);

  const id = crypto.randomUUID();
  const payload = {
    id,
    name: claim.name,
    email: claim.email,
    cohort: claim.cohort || '2026-spring',
    validFrom: new Date().toISOString(),
    noStatus: false,
  };

  let signed;
  try {
    ({ signed } = await issueCredential(payload, env, request.url));
  } catch (e) {
    return json({ error: 'Signing failed', detail: e.message }, 500);
  }

  claim.used = true;
  claim.issuedId = id;
  claim.issuedAt = new Date().toISOString();
  await env.CLAIMS_KV.put(`claim:${token}`, JSON.stringify(claim));

  return json({ ok: true, signed, name: claim.name, id });
}
