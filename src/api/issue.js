/**
 * POST /api/issue — sign a per-learner credential directly (admin path).
 *
 * This endpoint requires the shared `ISSUER_API_KEY` secret and is the
 * path used by internal tooling / tests. The learner-facing path is
 * /api/claim-code + /api/claim, which does not expose this secret.
 *
 * Request body (JSON):
 *   {
 *     "id":       "7f3c1e9a",             // required, [a-zA-Z0-9_-]{2,64}
 *     "email":    "learner@example.edu",  // optional → hashed into identifier
 *     "name":     "Ada L.",               // optional → shown as subject.name
 *     "cohort":   "2026-spring",          // optional, default "2026-spring"
 *     "validFrom":"2026-05-02T00:00:00Z", // optional, default now()
 *     "noStatus": false                   // optional, true skips credentialStatus
 *   }
 *
 * Response (200):
 *   { "ok": true, "signed": <signed VC>, "statusIndex": 0 }
 */
import { issueCredential, normalizeLearnerPayload } from '../lib/issue.js';
import { checkAdminAuth } from '../lib/auth.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export async function handleIssue(request, env, ctx) {
  if (request.method !== 'POST') {
    return json({
      error: 'Method Not Allowed',
      hint: 'POST JSON: {id, email?, name?, cohort?, validFrom?, noStatus?} with Authorization: Bearer <ISSUER_API_KEY>',
    }, 405);
  }

  const auth = checkAdminAuth(request, env);
  if (!auth.ok) return json(auth.body, auth.code);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, 400); }

  const parsed = normalizeLearnerPayload(body);
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  try {
    const { signed, statusIndex } = await issueCredential(parsed.value, env, request.url);
    return json({ ok: true, signed, statusIndex });
  } catch (e) {
    return json({
      ok: false,
      error: 'issueCredential failed',
      name: e.name,
      message: e.message,
      stack: e.stack?.split('\n').slice(0, 8).join('\n'),
    }, 500);
  }
}
