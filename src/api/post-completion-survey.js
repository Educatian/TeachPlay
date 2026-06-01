/**
 * POST /api/post-completion-survey
 *
 * Stores the learner's post-credential survey in D1 and optionally sends a
 * compact instructor notification. The response body is intentionally shaped
 * for the learner-facing survey page, not for analytics export.
 */
import { sendEmail } from '../lib/email.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_JSON_CHARS = 24000;
const MAX_TEXT_CHARS = 5000;

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function cleanText(value, max = MAX_TEXT_CHARS) {
  return value == null ? '' : String(value).trim().slice(0, max);
}

function cleanBool(value) {
  return value === true || value === 'true' || value === 'on' || value === 'yes';
}

function compactJson(value) {
  const text = JSON.stringify(value ?? {});
  return text.length > MAX_JSON_CHARS ? text.slice(0, MAX_JSON_CHARS) : text;
}

async function ensureSurveyTable(env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS post_completion_surveys (
      id TEXT PRIMARY KEY,
      learner_id TEXT,
      name TEXT,
      email TEXT,
      cohort TEXT NOT NULL DEFAULT '2026-spring',
      source TEXT,
      consent_program_evaluation INTEGER NOT NULL DEFAULT 0,
      consent_deidentified_research INTEGER NOT NULL DEFAULT 0,
      followup_consent INTEGER NOT NULL DEFAULT 0,
      background_json TEXT,
      learning_outcomes_json TEXT,
      module_ratings_json TEXT,
      media_reading_json TEXT,
      artifact_evidence_json TEXT,
      transfer_json TEXT,
      open_feedback TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();
}

async function sendInstructorNotice(env, survey) {
  if (!env.INSTRUCTOR_EMAIL || !env.RESEND_API_KEY) return;

  const modulesNeedingSupport = (survey.module_support_needed || [])
    .filter(Boolean)
    .slice(0, 8)
    .join(', ') || 'None selected';

  const html = `
  <h1 style="font-size:22px;margin:0 0 16px;line-height:1.3;">Post-credential survey received.</h1>
  <p style="font-size:15px;line-height:1.6;margin:0 0 12px;color:#333;">
    <strong>${survey.name || 'Learner'}</strong> (${survey.email}) submitted the TeachPlay post-completion survey.
  </p>
  <ul style="font-size:14px;line-height:1.7;color:#444;margin:0 0 16px;padding-left:18px;">
    <li>Cohort: ${survey.cohort || '2026-spring'}</li>
    <li>De-identified research permission: ${survey.consent_deidentified_research ? 'yes' : 'no'}</li>
    <li>Follow-up consent: ${survey.followup_consent ? 'yes' : 'no'}</li>
    <li>Modules needing support: ${modulesNeedingSupport}</li>
  </ul>
  <p style="font-size:14px;line-height:1.6;margin:0;color:#555;">
    Open the TeachPlay admin dashboard to review aggregate survey counts and learner completion status.
  </p>`;

  try {
    await sendEmail(env, {
      to: env.INSTRUCTOR_EMAIL,
      subject: 'TeachPlay post-credential survey received',
      html,
    });
  } catch { /* survey submission must not fail because email failed */ }
}

export async function handlePostCompletionSurvey(request, env) {
  if (request.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405);
  if (!env.DB) return json({ error: 'Database not configured' }, 500);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, 400); }

  if (!body || typeof body !== 'object') return json({ error: 'Body must be a JSON object' }, 400);

  const survey = {
    learner_id: cleanText(body.learner_id, 80),
    name: cleanText(body.name, 160),
    email: cleanText(body.email, 220).toLowerCase(),
    cohort: cleanText(body.cohort || '2026-spring', 40) || '2026-spring',
    source: cleanText(body.source, 120),
    consent_program_evaluation: cleanBool(body.consent_program_evaluation),
    consent_deidentified_research: cleanBool(body.consent_deidentified_research),
    followup_consent: cleanBool(body.followup_consent),
    background: body.background || {},
    learning_outcomes: body.learning_outcomes || {},
    module_ratings: body.module_ratings || [],
    module_support_needed: Array.isArray(body.module_support_needed) ? body.module_support_needed : [],
    media_reading: body.media_reading || {},
    artifact_evidence: body.artifact_evidence || {},
    transfer: body.transfer || {},
    open_feedback: cleanText(body.open_feedback),
  };

  if (!EMAIL_RE.test(survey.email)) return json({ error: 'Valid email is required' }, 400);
  if (!survey.consent_program_evaluation) {
    return json({ error: 'Please confirm the program evaluation acknowledgement before submitting.' }, 400);
  }

  await ensureSurveyTable(env);

  const learner = survey.learner_id
    ? await env.DB.prepare('SELECT id FROM learners WHERE id = ?').bind(survey.learner_id).first()
    : await env.DB.prepare('SELECT id FROM learners WHERE email = ?').bind(survey.email).first();

  const learnerId = learner?.id || survey.learner_id || null;
  const id = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO post_completion_surveys (
      id, learner_id, name, email, cohort, source,
      consent_program_evaluation, consent_deidentified_research, followup_consent,
      background_json, learning_outcomes_json, module_ratings_json,
      media_reading_json, artifact_evidence_json, transfer_json, open_feedback, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    id,
    learnerId,
    survey.name || null,
    survey.email,
    survey.cohort,
    survey.source || null,
    survey.consent_program_evaluation ? 1 : 0,
    survey.consent_deidentified_research ? 1 : 0,
    survey.followup_consent ? 1 : 0,
    compactJson(survey.background),
    compactJson(survey.learning_outcomes),
    compactJson({
      ratings: survey.module_ratings,
      support_needed: survey.module_support_needed,
    }),
    compactJson(survey.media_reading),
    compactJson(survey.artifact_evidence),
    compactJson(survey.transfer),
    survey.open_feedback || null,
  ).run();

  sendInstructorNotice(env, survey);

  return json({
    ok: true,
    survey_id: id,
    message: 'Survey submitted. Thank you for helping improve the TeachPlay credential.',
  });
}
