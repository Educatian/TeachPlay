/**
 * GET /api/progress?learner_id=<id>   — fetch by stored ID (primary)
 * POST /api/progress { email }         — fetch by email (fallback for lost localStorage)
 *
 * Returns learner profile + session completion + quiz performance.
 */

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export async function handleProgress(request, env) {
  if (!env.DB) return json({ error: 'DB not configured' }, 500);

  let learner;

  if (request.method === 'GET') {
    const id = new URL(request.url).searchParams.get('learner_id');
    if (!id) return json({ error: 'learner_id required' }, 400);
    learner = await env.DB.prepare(
      'SELECT id, name, email, cohort, enrolled_at, cred_status FROM learners WHERE id = ?'
    ).bind(id).first();
  } else if (request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    const email = body.email ? String(body.email).trim().toLowerCase() : '';
    if (!email) return json({ error: 'email required' }, 400);
    learner = await env.DB.prepare(
      'SELECT id, name, email, cohort, enrolled_at, cred_status FROM learners WHERE email = ?'
    ).bind(email).first();
  } else {
    return json({ error: 'GET or POST required' }, 405);
  }

  if (!learner) return json({ error: 'Learner not found' }, 404);

  const [sessionsRes, quizRes] = await env.DB.batch([
    env.DB.prepare(
      `SELECT DISTINCT activity_id FROM xapi_events
       WHERE learner_id = ? AND verb = 'completed' AND activity_type = 'session'
       ORDER BY created_at`
    ).bind(learner.id),
    env.DB.prepare(
      `SELECT AVG(score_raw) as avg_score, COUNT(*) as attempts,
              SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as correct
       FROM xapi_events WHERE learner_id = ? AND verb = 'answered'`
    ).bind(learner.id),
  ]);

  const sessions     = (sessionsRes.results || []).map(r => r.activity_id);
  const quizStats    = quizRes.results?.[0] || {};

  return json({
    ok: true,
    learner: {
      id:          learner.id,
      name:        learner.name,
      cohort:      learner.cohort,
      enrolled_at: learner.enrolled_at,
      cred_status: learner.cred_status,
    },
    completion: {
      complete:  sessions.length >= 12,
      count:     sessions.length,
      sessions,
    },
    quiz: {
      attempts:   quizStats.attempts  || 0,
      correct:    quizStats.correct   || 0,
      avg_score:  quizStats.avg_score != null ? Math.round(quizStats.avg_score * 10) / 10 : null,
    },
  });
}
