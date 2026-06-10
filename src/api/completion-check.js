/**
 * GET /api/completion-check?learner_id=<id>
 *
 * Returns which of the 12 sessions a learner has marked complete
 * (verb=completed, activity_type=session) according to D1.
 *
 * Response: { ok, complete, count, sessions: ['session/s01', ...] }
 *
 * Gated by the per-learner X-Learner-Token (same policy as GET /api/progress):
 * completion state is the learner's own data, so a bare learner_id must not be
 * enough to read it. Legacy rows with no token bind on first use (TOFU).
 */

import { learnerTokenDecision } from '../lib/security.js';
import {
  consentGateActive, postSurveyGateActive,
  consentCompleted, postSurveyCompleted,
} from '../lib/survey-gate.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export async function handleCompletionCheck(request, env) {
  const url = new URL(request.url);
  const learner_id = url.searchParams.get('learner_id');
  if (!learner_id) return json({ error: 'learner_id required' }, 400);
  if (!env.DB)     return json({ error: 'DB not configured' }, 500);

  const learner = await env.DB.prepare(
    'SELECT id, session_token FROM learners WHERE id = ?'
  ).bind(learner_id).first();
  if (!learner) return json({ error: 'Learner not found' }, 404);

  const providedToken = request.headers.get('x-learner-token') || '';
  const decision = learnerTokenDecision(learner.session_token, providedToken);
  if (decision === 'reject') return json({ error: 'Invalid or missing session token' }, 403);
  if (decision === 'bind') {
    await env.DB.prepare('UPDATE learners SET session_token = ? WHERE id = ? AND session_token IS NULL')
      .bind(providedToken, learner.id).run();
  }

  const rows = await env.DB.prepare(
    `SELECT DISTINCT activity_id FROM xapi_events
     WHERE learner_id = ? AND verb = 'completed' AND activity_type = 'session'`
  ).bind(learner_id).all();

  const sessions = (rows.results || []).map(r => r.activity_id);
  const count    = sessions.length;

  // Survey gates (feature-detected; INACTIVE unless migration 0010 columns AND
  // QUALTRICS_* secrets are configured). The UI uses these to decide whether to
  // show the consent-to-start CTA and the post-survey-to-claim CTA.
  const consentActive = await consentGateActive(env);
  const postActive    = await postSurveyGateActive(env);
  const gate = {
    consent: {
      active: consentActive,
      completed: consentActive ? await consentCompleted(env, learner_id) : null,
    },
    survey: {
      active: postActive,
      completed: postActive ? await postSurveyCompleted(env, learner_id) : null,
    },
  };

  return json({ ok: true, complete: count >= 12, count, sessions, gate });
}
