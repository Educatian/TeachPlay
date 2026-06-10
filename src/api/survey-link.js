/**
 * GET /api/survey-link?type=consent|post — return the signed Qualtrics link.
 *
 * Learner-token gated (X-Learner-Token, same policy as /api/progress): a learner
 * may only mint their own survey link. Returns the Qualtrics anonymous link with
 *   ?learner_id=<id>&sig=<HMAC>&cohort=<c>
 * appended, where sig = HMAC-SHA256(`${type}:${learner_id}`) using WORKER_SECRET
 * (or ISSUER_API_KEY). The Qualtrics survey captures learner_id/sig/cohort as
 * embedded data and echoes them back to /api/consent-complete or
 * /api/survey-complete on the end-of-survey redirect, where the sig is verified.
 *
 * Feature-detect: if the QUALTRICS_* secrets / survey ids are absent the gate is
 * INACTIVE; we return { ok:true, active:false } so the UI shows the legacy flow
 * (no lockout) instead of a broken link.
 */
import { learnerTokenDecision } from '../lib/security.js';
import { signSurveyToken } from '../lib/survey-gate.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export async function handleSurveyLink(request, env) {
  if (request.method !== 'GET') return json({ error: 'Method Not Allowed' }, 405);
  if (!env.DB) return json({ error: 'DB not configured' }, 500);

  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  if (type !== 'consent' && type !== 'post') {
    return json({ error: 'type must be consent or post' }, 400);
  }
  const learner_id = url.searchParams.get('learner_id') ||
                     request.headers.get('x-learner-id') || '';
  if (!learner_id) return json({ error: 'learner_id required' }, 400);

  const learner = await env.DB.prepare(
    'SELECT id, cohort, session_token FROM learners WHERE id = ?'
  ).bind(learner_id).first();
  if (!learner) return json({ error: 'Learner not found' }, 404);

  const providedToken = request.headers.get('x-learner-token') || '';
  const decision = learnerTokenDecision(learner.session_token, providedToken);
  if (decision === 'reject') return json({ error: 'Invalid or missing session token' }, 403);
  if (decision === 'bind') {
    await env.DB.prepare('UPDATE learners SET session_token = ? WHERE id = ? AND session_token IS NULL')
      .bind(providedToken, learner.id).run();
  }

  const sid = type === 'consent' ? env.QUALTRICS_CONSENT_SID : env.QUALTRICS_POST_SID;
  const sig = await signSurveyToken(env, type, learner_id);

  // Gate inactive (no secrets configured): tell the UI to use the legacy flow.
  if (!sid || !sig || !env.QUALTRICS_TOKEN) {
    return json({ ok: true, active: false, type });
  }

  const dc = env.QUALTRICS_DC || 'az1';
  const cohort = learner.cohort || '2026-spring';
  const link = `https://${dc}.qualtrics.com/jfe/form/${sid}` +
    `?learner_id=${encodeURIComponent(learner_id)}` +
    `&sig=${encodeURIComponent(sig)}` +
    `&cohort=${encodeURIComponent(cohort)}`;

  return json({ ok: true, active: true, type, link });
}
