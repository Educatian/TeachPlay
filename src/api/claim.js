/**
 * GET/POST /api/claim — redeem a one-time claim code for a signed VC.
 *
 * Public. No admin secret, no bearer token. The code itself is the
 * authz: a fresh, unguessable, single-use string bound at mint time
 * to one learner payload (see /api/claim-code).
 *
 * Accepts the code in three places, in this order:
 *   1. POST body  — JSON `{ "code": "cl_..." }`
 *   2. query      — `?code=cl_...` (GET or POST)
 *   3. Authorization: Bearer cl_... — for wallets that always send auth
 *
 * The first two match what the /claim HTML page and download button
 * produce; the third matches what a DCC LCW-style wallet would send
 * if configured to treat the claim code as a token.
 *
 * On success: delete the code (strict one-shot, independent of KV
 * TTL), issue the VC with the bound payload, return the signed VC as
 * application/ld+json so wallets that "open-with" JSON-LD take it.
 *
 * On reuse / expired / unknown: 404. We do not leak whether a code
 * "was valid once" — treat any bad code as equally unknown.
 */
import { issueCredential } from '../lib/issue.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

async function extractCode(request) {
  const url = new URL(request.url);
  const q = url.searchParams.get('code');
  if (q) return q;
  if (request.method === 'POST') {
    try {
      const b = await request.json();
      if (b && typeof b.code === 'string') return b.code;
    } catch { /* ignore — fall through */ }
  }
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (match) return match[1];
  return null;
}

const CODE_PATTERN = /^cl_[0-9a-f]{64}$/;

export async function handleClaim(request, env, ctx) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405);
  }

  const code = await extractCode(request);
  if (!code || !CODE_PATTERN.test(code)) {
    return json({ error: 'Missing or malformed claim code' }, 400);
  }

  const raw = await env.CLAIM_CODES.get(code);
  if (!raw) return json({ error: 'Unknown or expired claim code' }, 404);

  // One-shot: delete before issuance. If issuance fails, the code is
  // gone — but the alternative (delete after) allows double-redemption
  // on a retry. Losing a code to a transient signing failure is the
  // safer error mode: the admin can just mint another.
  await env.CLAIM_CODES.delete(code);

  let payload;
  try { payload = JSON.parse(raw); }
  catch { return json({ error: 'Claim payload corrupt' }, 500); }

  try {
    const { signed, statusIndex } = await issueCredential(payload, env, request.url);
    return new Response(JSON.stringify(signed, null, 2), {
      status: 200,
      headers: {
        'content-type': 'application/ld+json; charset=utf-8',
        'cache-control': 'no-store',
        'content-disposition': `attachment; filename="teachplay-credential-${payload.id}.json"`,
        'x-status-index': statusIndex == null ? '' : String(statusIndex),
      },
    });
  } catch (e) {
    return json({
      ok: false,
      error: 'issueCredential failed',
      name: e.name,
      message: e.message,
    }, 500);
  }
}
