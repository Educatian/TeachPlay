/**
 * POST /api/xapi — ingest xAPI 1.0.3 statements from a learner.
 *
 * Accepts either:
 *   - a JSON array of full xAPI statements (each with `.verb.id` and `.object.id`)
 *   - a single simplified object { verb, activity_id, activity_type?, … }
 *
 * After inserting, checks whether the learner just completed all 12 sessions
 * and sends the instructor a notification email if so (one-time, via Resend).
 */

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function normaliseFullStatement(stmt) {
  const verbId      = stmt.verb.id || '';
  const verb        = verbId.split('/').filter(Boolean).at(-1) ?? verbId;
  const objectId    = stmt.object.id || '';
  const activity_id = objectId.replace('https://teachplay.dev/activities/', '');
  const typeId      = stmt.object.definition?.type || '';
  const activity_type = typeId.split('/').filter(Boolean).at(-1) ?? typeId;
  return {
    verb, activity_id, activity_type,
    score_raw:  stmt.result?.score?.raw  ?? null,
    score_max:  stmt.result?.score?.max  ?? null,
    success:    stmt.result?.success != null ? (stmt.result.success ? 1 : 0) : null,
    response:   JSON.stringify(stmt.result?.response ?? null),
  };
}

function normaliseSimplified(stmt) {
  return {
    verb:          String(stmt.verb),
    activity_id:   String(stmt.activity_id),
    activity_type: stmt.activity_type != null ? String(stmt.activity_type) : null,
    score_raw:     stmt.score_raw  ?? null,
    score_max:     stmt.score_max  ?? null,
    success:       stmt.success != null ? (stmt.success ? 1 : 0) : null,
    response:      JSON.stringify(stmt.response ?? null),
  };
}

async function checkAndNotifyCompletion(env, learner_id) {
  try {
    const row = await env.DB.prepare(
      `SELECT COUNT(DISTINCT activity_id) as cnt FROM xapi_events
       WHERE learner_id = ? AND verb = 'completed' AND activity_type = 'session'`
    ).bind(learner_id).first();
    if (!row || row.cnt < 12) return;

    const learner = await env.DB.prepare(
      'SELECT name, email, completion_notified_at FROM learners WHERE id = ?'
    ).bind(learner_id).first();
    if (!learner || learner.completion_notified_at) return;
    if (!env.RESEND_API_KEY || !env.INSTRUCTOR_EMAIL) return;

    const html = `<p>Hi,</p>
<p><strong>${learner.name}</strong> (${learner.email}) has completed all 12 sessions of the
AI-enhanced Educational Game Design microcredential.</p>
<p>Log in to <a href="https://teachplay.dev/admin.html">admin.html</a> to review and issue their credential.</p>`;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'TeachPlay <credentials@teachplay.dev>',
        to: [env.INSTRUCTOR_EMAIL],
        subject: `${learner.name} completed the microcredential`,
        html,
      }),
    });

    await env.DB.prepare(
      `UPDATE learners SET completion_notified_at = datetime('now') WHERE id = ?`
    ).bind(learner_id).run();
  } catch { /* silent — never block the main response */ }
}

export async function handleXapiCollect(request, env) {
  if (request.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405);

  const learner_id = request.headers.get('x-learner-id');
  if (!learner_id) return json({ error: 'Missing X-Learner-ID header' }, 401);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, 400); }

  const rawStatements = Array.isArray(body) ? body : [body];
  if (!rawStatements.length) return json({ error: 'No statements provided' }, 400);

  const db = env.DB;
  const learnerRow = await db.prepare('SELECT id FROM learners WHERE id = ?').bind(learner_id).first();
  if (!learnerRow) return json({ error: 'Learner not found' }, 403);

  const statements = rawStatements.map(stmt => {
    const isFull = stmt && typeof stmt === 'object' &&
      typeof stmt.verb === 'object' && stmt.verb?.id &&
      typeof stmt.object === 'object' && stmt.object?.id;
    return isFull ? normaliseFullStatement(stmt) : normaliseSimplified(stmt);
  });

  const INSERT_SQL = `INSERT INTO xapi_events
    (learner_id, verb, activity_id, activity_type, score_raw, score_max, success, response, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`;

  await db.batch(statements.map(s =>
    db.prepare(INSERT_SQL).bind(learner_id, s.verb, s.activity_id, s.activity_type ?? null,
      s.score_raw ?? null, s.score_max ?? null, s.success ?? null, s.response)
  ));

  // Fire-and-forget: check if learner just hit 12 completions
  const hasSessionComplete = statements.some(s => s.verb === 'completed' && s.activity_type === 'session');
  if (hasSessionComplete) checkAndNotifyCompletion(env, learner_id);

  return json({ ok: true, stored: statements.length });
}
