/**
 * POST /api/xapi-collect — ingest xAPI 1.0.3 statements from a learner.
 *
 * Accepts either:
 *   - a JSON array of full xAPI statements (each with `.verb.id` and `.object.id`)
 *   - a single simplified object { verb, activity_id, activity_type?, score_raw?,
 *     score_max?, success?, response? }
 *
 * The learner is identified via the `X-Learner-ID` request header, which must
 * correspond to a row in the `learners` table. All statements are batch-inserted
 * into `xapi_events` using D1's db.batch() for atomicity and efficiency.
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

/**
 * Normalise a full xAPI 1.0.3 statement into the flat shape used by xapi_events.
 */
function normaliseFullStatement(stmt) {
  const verbId = stmt.verb.id || '';
  const verb = verbId.split('/').filter(Boolean).at(-1) ?? verbId;

  const objectId = stmt.object.id || '';
  const activity_id = objectId.replace('https://teachplay.dev/activities/', '');

  const typeId = stmt.object.definition?.type || '';
  const activity_type = typeId.split('/').filter(Boolean).at(-1) ?? typeId;

  const score_raw = stmt.result?.score?.raw ?? null;
  const score_max = stmt.result?.score?.max ?? null;
  const success =
    stmt.result?.success != null ? (stmt.result.success ? 1 : 0) : null;
  const response = JSON.stringify(stmt.result?.response ?? null);

  return { verb, activity_id, activity_type, score_raw, score_max, success, response };
}

/**
 * Normalise a simplified statement object into the flat shape used by xapi_events.
 */
function normaliseSimplifiedStatement(stmt) {
  return {
    verb: String(stmt.verb),
    activity_id: String(stmt.activity_id),
    activity_type: stmt.activity_type != null ? String(stmt.activity_type) : null,
    score_raw: stmt.score_raw ?? null,
    score_max: stmt.score_max ?? null,
    success: stmt.success != null ? (stmt.success ? 1 : 0) : null,
    response: JSON.stringify(stmt.response ?? null),
  };
}

export async function handleXapiCollect(request, env) {
  if (request.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405);
  }

  const learner_id = request.headers.get('x-learner-id');
  if (!learner_id) {
    return json({ error: 'Missing X-Learner-ID header' }, 401);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, 400); }

  // Normalise to an array of raw statement objects.
  const rawStatements = Array.isArray(body) ? body : [body];
  if (rawStatements.length === 0) {
    return json({ error: 'No statements provided' }, 400);
  }

  const db = env.DB;

  // Verify the learner exists.
  let learnerRow;
  try {
    learnerRow = await db
      .prepare('SELECT id FROM learners WHERE id = ?')
      .bind(learner_id)
      .first();
  } catch (e) {
    return json({ ok: false, error: 'Database error', message: e.message }, 500);
  }

  if (!learnerRow) {
    return json({ error: 'Learner not found' }, 403);
  }

  // Map each raw statement to its normalised flat shape.
  const statements = rawStatements.map(stmt => {
    const isFullStatement =
      stmt && typeof stmt === 'object' &&
      typeof stmt.verb === 'object' && stmt.verb !== null && stmt.verb.id &&
      typeof stmt.object === 'object' && stmt.object !== null && stmt.object.id;

    return isFullStatement
      ? normaliseFullStatement(stmt)
      : normaliseSimplifiedStatement(stmt);
  });

  // Build a D1 prepared statement for each row and batch-insert.
  const INSERT_SQL =
    `INSERT INTO xapi_events
       (learner_id, verb, activity_id, activity_type, score_raw, score_max, success, response, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`;

  try {
    const prepared = statements.map(s =>
      db.prepare(INSERT_SQL).bind(
        learner_id,
        s.verb,
        s.activity_id,
        s.activity_type ?? null,
        s.score_raw ?? null,
        s.score_max ?? null,
        s.success ?? null,
        s.response,
      ),
    );

    await db.batch(prepared);
  } catch (e) {
    return json({ ok: false, error: 'Database error', message: e.message }, 500);
  }

  return json({ ok: true, stored: statements.length });
}
