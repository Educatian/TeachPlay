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
import { sendEmail } from '../lib/email.js';

async function sendWelcomeEmail(env, { to, name }) {
  const html = `
  <h1 style="font-size:24px;margin:0 0 16px;line-height:1.3;">Welcome, ${name}.</h1>
  <p style="font-size:16px;line-height:1.6;margin:0 0 20px;color:#333;">
    You are enrolled in <strong>AI-enhanced Educational Game Design</strong>, a
    twelve-session microcredential from the University of Alabama College of
    Education. Each session is ~3 hours of content plus homework; you can work
    at your own pace and resume on any device.
  </p>
  <a href="https://teachplay.dev/session-01.html"
     style="display:inline-block;background:#be1a2f;color:#fff;text-decoration:none;
            padding:13px 26px;border-radius:6px;font-size:15px;font-weight:600;">
    Begin Session 01 →
  </a>
  <p style="margin:24px 0 0;font-size:14px;color:#555;line-height:1.6;">
    Track completion any time at
    <a href="https://teachplay.dev/progress.html" style="color:#be1a2f;">
      teachplay.dev/progress.html
    </a>. After finishing all 12 sessions, you can request your signed
    Open Badge 3.0 credential directly from the final session page.
  </p>`;
  try {
    await sendEmail(env, { to, subject: 'Welcome to AI-enhanced Educational Game Design', html });
  } catch { /* fire-and-forget — never block enrollment on mail failure */ }
}

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

    const insertResult = await db
      .prepare(
        `INSERT OR IGNORE INTO learners (id, email, email_hash, name, cohort, enrolled_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      )
      .bind(id, email, email_hash, name, cohort)
      .run();

    // meta.changes === 1 → row actually inserted (first-time enrolment).
    // Fire welcome email only in that case so repeat /api/enroll hits
    // (e.g. re-registration from another device) don't spam the user.
    const isNewEnrollment = insertResult?.meta?.changes === 1;

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

    if (isNewEnrollment) {
      sendWelcomeEmail(env, { to: email, name: row.name });
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
