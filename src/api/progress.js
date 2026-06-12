/**
 * GET  /api/progress?learner_id=<id>   — fetch by stored ID (primary).
 *                                         Requires the per-learner token via
 *                                         the X-Learner-Token header (legacy
 *                                         rows without a token are bound TOFU).
 * POST /api/progress { email }          — recover a lost session. Does NOT
 *                                         return profile data (that would let
 *                                         anyone enumerate enrolments + read
 *                                         names/progress by email). Instead it
 *                                         emails a recovery link to the address
 *                                         on file and always returns the same
 *                                         generic response.
 *
 * Returns learner profile + session completion + quiz performance (GET only).
 */
import { sendEmail } from '../lib/email.js';
import { escapeHtml, randomToken, getClientIp, rateLimit, learnerTokenDecision } from '../lib/security.js';
import { rubricTablesExist, DELIVERABLES } from '../lib/rubric.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function sendRecoveryEmail(env, { to, id, token }) {
  const link = `https://teachplay.dev/progress.html?lid=${encodeURIComponent(id)}&t=${encodeURIComponent(token)}`;
  const html = `
  <h1 style="font-size:22px;margin:0 0 16px;line-height:1.3;">Resume your progress</h1>
  <p style="font-size:15px;line-height:1.6;margin:0 0 16px;color:#333;">
    You asked to recover your TeachPlay progress. Open this link on the device
    you want to use, and your dashboard will reconnect automatically:
  </p>
  <p style="margin:0 0 20px;">
    <a href="${escapeHtml(link)}" style="color:#be1a2f;font-weight:600;">View my progress &rarr;</a>
  </p>
  <p style="font-size:13px;line-height:1.6;margin:0;color:#777;">
    If you did not request this, you can ignore this email — nothing has changed.
  </p>`;
  try {
    await sendEmail(env, { to, subject: 'Your TeachPlay progress link', html });
  } catch { /* fire-and-forget — never reveal send success/failure to the caller */ }
}

export async function handleProgress(request, env) {
  if (!env.DB) return json({ error: 'DB not configured' }, 500);

  // ── POST: email-based recovery (anti-enumeration) ──────────────────────────
  if (request.method === 'POST') {
    const limit = await rateLimit(env, 'progress-recover', getClientIp(request), 8, 3600);
    if (!limit.ok) return json({ error: 'Too many requests. Please try again later.' }, 429);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
    const email = body.email ? String(body.email).trim().toLowerCase() : '';
    if (!EMAIL_RE.test(email)) return json({ error: 'A valid email is required' }, 400);

    const learner = await env.DB.prepare(
      'SELECT id, session_token FROM learners WHERE email = ?'
    ).bind(email).first();

    if (learner) {
      let token = learner.session_token;
      if (!token) {
        token = randomToken();
        await env.DB.prepare('UPDATE learners SET session_token = ? WHERE id = ? AND session_token IS NULL')
          .bind(token, learner.id).run();
      }
      await sendRecoveryEmail(env, { to: email, id: learner.id, token });
    }

    // Identical response whether or not the email is enrolled.
    return json({
      ok: true,
      recovery: true,
      message: "If that email is enrolled, we've sent a link to resume your progress.",
    });
  }

  if (request.method !== 'GET') return json({ error: 'GET or POST required' }, 405);

  // ── GET: token-gated profile fetch by id ───────────────────────────────────
  const id = new URL(request.url).searchParams.get('learner_id');
  if (!id) return json({ error: 'learner_id required' }, 400);

  const learner = await env.DB.prepare(
    'SELECT id, name, email, cohort, enrolled_at, cred_status, session_token FROM learners WHERE id = ?'
  ).bind(id).first();
  if (!learner) return json({ error: 'Learner not found' }, 404);

  const providedToken = request.headers.get('x-learner-token') || '';
  const decision = learnerTokenDecision(learner.session_token, providedToken);
  if (decision === 'reject') return json({ error: 'Invalid or missing session token' }, 403);
  if (decision === 'bind') {
    await env.DB.prepare('UPDATE learners SET session_token = ? WHERE id = ? AND session_token IS NULL')
      .bind(providedToken, learner.id).run();
  }

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

  // Evidence packet status — feature-detected (mig 0008). Lets the progress
  // page show "submit your evidence packet" as an explicit step instead of
  // learners discovering it as a 422 at approval time.
  let evidence = { applicable: false, submitted: false, deliverables: 0, required: DELIVERABLES.length };
  try {
    if (await rubricTablesExist(env)) {
      const row = await env.DB.prepare(
        'SELECT COUNT(DISTINCT deliverable_id) AS cnt FROM evidence_submissions WHERE learner_id = ?'
      ).bind(learner.id).first();
      const cnt = row ? Number(row.cnt) || 0 : 0;
      evidence = { applicable: true, submitted: cnt >= DELIVERABLES.length, deliverables: cnt, required: DELIVERABLES.length };
    }
  } catch { /* progress display must never fail on the evidence lookup */ }

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
    evidence,
  });
}
