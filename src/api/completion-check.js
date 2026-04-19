/**
 * GET /api/completion-check?learner_id=<id>
 *
 * Returns which of the 12 sessions a learner has marked complete
 * (verb=completed, activity_type=session) according to D1.
 *
 * Response: { ok, complete, count, sessions: ['session/s01', ...] }
 */

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

  const rows = await env.DB.prepare(
    `SELECT DISTINCT activity_id FROM xapi_events
     WHERE learner_id = ? AND verb = 'completed' AND activity_type = 'session'`
  ).bind(learner_id).all();

  const sessions = (rows.results || []).map(r => r.activity_id);
  const count    = sessions.length;

  return json({ ok: true, complete: count >= 12, count, sessions });
}
