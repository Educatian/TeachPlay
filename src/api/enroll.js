/**
 * POST /api/enroll — register a learner in the D1 `learners` table.
 *
 * Public endpoint. Creates the learner row if it does not already exist
 * (INSERT OR IGNORE), then returns the current row so the client always
 * gets the canonical learner_id regardless of whether this was a first-
 * time enrolment or a repeat call (idempotent by email+cohort).
 *
 * Body: { name, email, cohort? }
 *   name    — display name, ≥ 2 characters
 *   email   — standard email address
 *   cohort  — optional; defaults to '2026-spring'; must match [a-z0-9-]{2,32}
 */
import { sha256Hex } from '../lib/issue.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COHORT_PATTERN = /^[a-z0-9-]{2,32}$/;

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export async function handleEnroll(request, env) {
  if (request.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, 400); }

  if (!body || typeof body !== 'object') {
    return json({ error: 'Body must be a JSON object' }, 400);
  }

  const name = body.name != null ? String(body.name).trim() : '';
  if (name.length < 2) {
    return json({ error: '`name` must be at least 2 characters' }, 400);
  }

  const email = body.email != null ? String(body.email).trim().toLowerCase() : '';
  if (!EMAIL_PATTERN.test(email)) {
    return json({ error: '`email` must be a valid email address' }, 400);
  }

  const cohort = body.cohort != null ? String(body.cohort).trim() : '2026-spring';
  if (!COHORT_PATTERN.test(cohort)) {
    return json({ error: '`cohort` must match [a-z0-9-]{2,32}' }, 400);
  }

  const email_hash = await sha256Hex(cohort + email);
  const id = crypto.randomUUID();

  try {
    const db = env.DB;

    await db
      .prepare(
        `INSERT OR IGNORE INTO learners (id, email, email_hash, name, cohort, enrolled_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      )
      .bind(id, email, email_hash, name, cohort)
      .run();

    const row = await db
      .prepare(
        `SELECT id, name, cohort, enrolled_at, cred_status
         FROM learners WHERE email = ?`,
      )
      .bind(email)
      .first();

    if (!row) {
      return json({ error: 'Enrolment failed: learner not found after insert' }, 500);
    }

    return json({
      ok: true,
      learner_id: row.id,
      name: row.name,
      cohort: row.cohort,
      cred_status: row.cred_status,
    });
  } catch (e) {
    return json({ ok: false, error: 'Database error', message: e.message }, 500);
  }
}
