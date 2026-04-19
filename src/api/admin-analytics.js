/**
 * GET /api/admin-analytics — aggregated learner + activity analytics.
 *
 * Protected by `Authorization: Bearer <ISSUER_API_KEY>`. Returns four
 * aggregated datasets from D1 in a single response:
 *
 *   learners        — per-learner completion stats (sessions done, quiz
 *                     answers, quiz average score)
 *   funnel          — per-session completion counts
 *   hardest_questions — per-question error rate, worst 20 first
 *   skills_growth   — pre/post self-assessment averages per skill
 */

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export async function handleAdminAnalytics(request, env) {
  if (request.method !== 'GET') {
    return json({ error: 'Method Not Allowed' }, 405);
  }

  const authHeader = request.headers.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match || match[1] !== env.ISSUER_API_KEY) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const db = env.DB;

  try {
    const [learnersResult, funnelResult, hardestResult, skillsResult] =
      await db.batch([
        // Query 1 — learner list with completion stats
        db.prepare(`
          SELECT l.id, l.name, l.email, l.cohort, l.enrolled_at, l.cred_status,
            COUNT(DISTINCT CASE WHEN e.verb = 'completed' AND e.activity_type = 'session' THEN e.activity_id END) AS sessions_done,
            COUNT(DISTINCT CASE WHEN e.verb = 'answered' THEN e.id END) AS quiz_answers,
            AVG(CASE WHEN e.verb = 'scored' THEN e.score_raw END) AS quiz_avg
          FROM learners l
          LEFT JOIN xapi_events e ON e.learner_id = l.id
          GROUP BY l.id
          ORDER BY l.enrolled_at DESC
        `),

        // Query 2 — per-session completion funnel
        db.prepare(`
          SELECT activity_id, COUNT(DISTINCT learner_id) AS completions
          FROM xapi_events
          WHERE verb = 'completed' AND activity_type = 'session'
          GROUP BY activity_id
          ORDER BY activity_id
        `),

        // Query 3 — per-question error rate (worst 20 first)
        db.prepare(`
          SELECT activity_id,
            COUNT(*) AS attempts,
            SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) AS correct
          FROM xapi_events
          WHERE verb = 'answered'
          GROUP BY activity_id
          ORDER BY (SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) * 1.0 / COUNT(*)) ASC
          LIMIT 20
        `),

        // Query 4 — self-assessment pre/post averages per skill
        db.prepare(`
          SELECT activity_id,
            AVG(CASE WHEN activity_id LIKE 'self-assessment/pre/%' THEN score_raw END) AS pre_avg,
            AVG(CASE WHEN activity_id LIKE 'self-assessment/post/%' THEN score_raw END) AS post_avg
          FROM xapi_events
          WHERE verb = 'answered' AND activity_type = 'self-assessment'
          GROUP BY substr(activity_id, instr(activity_id, '/', instr(activity_id, '/')+1)+1)
        `),
      ]);

    const learners = learnersResult.results ?? [];

    return json({
      ok: true,
      total_learners: learners.length,
      learners,
      funnel: funnelResult.results ?? [],
      hardest_questions: hardestResult.results ?? [],
      skills_growth: skillsResult.results ?? [],
    });
  } catch (e) {
    return json({ ok: false, error: 'Database error', message: e.message }, 500);
  }
}
