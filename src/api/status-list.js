/**
 * GET /api/status-list/<cohort> — serve the signed BitstringStatusList
 * credential for a cohort, reading the live bits from KV and signing
 * a fresh VC on each request.
 *
 * Public endpoint (no auth). Verifiers need to fetch it to check the
 * revocation bit on any credential whose `credentialStatus` points
 * here. Returning a 401 would break every verify.
 *
 * The Worker never persists a signed status-list VC — it only persists
 * the raw bits. Re-signing per request is a few ms (ed25519 + RDFC
 * canonicalization) and means the VC's `validFrom` is always fresh,
 * which matters because the BitstringStatusList spec allows consumers
 * to reject outdated list snapshots.
 *
 * If the cohort has never been touched (no KV entry yet), we return a
 * signed list with all bits zero rather than a 404. A bitstring the
 * verifier has never seen before is indistinguishable from one that
 * exists with nobody revoked, which is correct.
 */
import { buildSignedStatusList, DEFAULT_BITSTRING_SIZE } from '../lib/status-list.js';

const COHORT_PATTERN = /^[a-z0-9-]{2,32}$/;

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
  });
}

export async function handleStatusList(request, env, ctx, cohort) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return json({ error: 'Method Not Allowed' }, 405);
  }
  if (!cohort || !COHORT_PATTERN.test(cohort)) {
    return json({ error: '`cohort` must match [a-z0-9-]{2,32}' }, 400);
  }

  try {
    const signed = await buildSignedStatusList(env, cohort, DEFAULT_BITSTRING_SIZE);
    return new Response(JSON.stringify(signed, null, 2), {
      status: 200,
      headers: {
        'content-type': 'application/ld+json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  } catch (e) {
    return json({
      ok: false,
      error: 'status-list sign failed',
      name: e.name,
      message: e.message,
    }, 500);
  }
}
