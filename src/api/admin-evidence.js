/**
 * Facilitator-side rubric review + scoring.
 *
 *   GET  /api/admin/evidence?learner_id=<id>
 *        Returns the learner's submitted deliverables (D1..D5) plus any rubric
 *        scores already recorded, plus the canonical rubric definition so the
 *        admin UI can render the 25 criteria × 4 levels without hardcoding them.
 *
 *   POST /api/admin/score
 *        Body: { learner_id, scores: [{ criterion_id, level }, ...] }
 *        Upserts rubric_scores for the learner. `level` must be one of the four
 *        rubric levels; `criterion_id` must be one of the canonical 25.
 *
 * Both are admin-gated via checkAdminAuth (ISSUER_API_KEY) — the same gate as
 * /api/admin/analytics. Feature-detected: if the 0008 tables don't exist yet,
 * GET returns the rubric with empty data and POST returns 503 so the pre-
 * migration app degrades cleanly.
 *
 * Nothing here touches credential signing, the VC/OB schema, or key material.
 */

import { checkAdminAuth } from '../lib/auth.js';
import { getClientIp, rateLimit } from '../lib/security.js';
import {
  RUBRIC, LEVELS, PASS_LEVEL, DELIVERABLES, TOTAL_CRITERIA,
  isValidCriterionId, isValidLevel, rubricTablesExist, rubricPassed,
} from '../lib/rubric.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

const rubricMeta = {
  levels: LEVELS,
  pass_level: PASS_LEVEL,
  deliverables: DELIVERABLES,
  total_criteria: TOTAL_CRITERIA,
  rubric: RUBRIC,
};

export async function handleAdminEvidence(request, env) {
  if (request.method !== 'GET') return json({ error: 'Method Not Allowed' }, 405);

  const limit = await rateLimit(env, 'admin', getClientIp(request), 30, 60);
  if (!limit.ok) return json({ error: 'Too many requests' }, 429);

  const auth = checkAdminAuth(request, env);
  if (!auth.ok) return json(auth.body, auth.code);

  if (!env.DB) return json({ error: 'DB not configured' }, 500);

  const learner_id = new URL(request.url).searchParams.get('learner_id');
  if (!learner_id) return json({ error: 'learner_id required' }, 400);

  const learner = await env.DB.prepare(
    'SELECT id, name, email, cohort, cred_status FROM learners WHERE id = ?'
  ).bind(learner_id).first();
  if (!learner) return json({ error: 'Learner not found' }, 404);

  // Pre-migration: return the rubric so the UI renders, but no stored data.
  if (!(await rubricTablesExist(env))) {
    return json({
      ok: true,
      enabled: false,
      learner,
      meta: rubricMeta,
      submissions: [],
      scores: {},
      verdict: { applicable: false, passed: false, reason: 'evidence/rubric tables not enabled' },
    });
  }

  const [subRes, scoreRes] = await env.DB.batch([
    env.DB.prepare(
      `SELECT deliverable_id, content_json, file_name, file_size, file_type,
              (file_b64 IS NOT NULL) AS has_file_b64, submitted_at, updated_at
       FROM evidence_submissions WHERE learner_id = ?
       ORDER BY deliverable_id`
    ).bind(learner_id),
    env.DB.prepare(
      'SELECT criterion_id, level, scorer_email, scored_at FROM rubric_scores WHERE learner_id = ?'
    ).bind(learner_id),
  ]);

  const scores = {};
  for (const r of (scoreRes.results || [])) {
    scores[r.criterion_id] = { level: r.level, scorer_email: r.scorer_email, scored_at: r.scored_at };
  }

  const verdict = await rubricPassed(env, learner_id);

  return json({
    ok: true,
    enabled: true,
    learner,
    meta: rubricMeta,
    submissions: subRes.results || [],
    scores,
    verdict,
  });
}

export async function handleAdminScore(request, env) {
  if (request.method !== 'POST') return json({ error: 'POST required' }, 405);

  const limit = await rateLimit(env, 'admin', getClientIp(request), 30, 60);
  if (!limit.ok) return json({ error: 'Too many requests' }, 429);

  const auth = checkAdminAuth(request, env);
  if (!auth.ok) return json(auth.body, auth.code);

  if (!env.DB) return json({ error: 'DB not configured' }, 500);

  if (!(await rubricTablesExist(env))) {
    return json({ ok: false, error: 'rubric scoring not yet enabled' }, 503);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const learner_id = body && body.learner_id != null ? String(body.learner_id).trim() : '';
  if (!learner_id) return json({ error: 'learner_id required' }, 400);
  const scores = Array.isArray(body.scores) ? body.scores : null;
  if (!scores || !scores.length) return json({ error: 'scores[] required' }, 400);

  const learner = await env.DB.prepare('SELECT id FROM learners WHERE id = ?').bind(learner_id).first();
  if (!learner) return json({ error: 'Learner not found' }, 404);

  // Identify the scorer from the admin auth context for the audit trail. The
  // admin key is shared, so we record the optional X-Scorer-Email header if the
  // facilitator supplies one (the admin UI sends it); else null.
  const scorer_email = (request.headers.get('x-scorer-email') || '').trim().slice(0, 256) || null;

  const valid = [];
  const rejected = [];
  for (const s of scores) {
    if (!s || typeof s !== 'object') { rejected.push('(non-object)'); continue; }
    const cid = String(s.criterion_id || '');
    const level = String(s.level || '');
    if (!isValidCriterionId(cid)) { rejected.push(cid || '(empty criterion_id)'); continue; }
    if (!isValidLevel(level)) { rejected.push(`${cid}:${level}`); continue; }
    valid.push({ cid, level });
  }

  if (!valid.length) return json({ error: 'No valid scores (criterion_id × level)', rejected }, 400);

  const UPSERT = `
    INSERT INTO rubric_scores (learner_id, criterion_id, level, scorer_email, scored_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(learner_id, criterion_id) DO UPDATE SET
      level = excluded.level,
      scorer_email = excluded.scorer_email,
      scored_at = datetime('now')`;

  try {
    await env.DB.batch(valid.map(v =>
      env.DB.prepare(UPSERT).bind(learner_id, v.cid, v.level, scorer_email)
    ));
  } catch (e) {
    console.error('admin-score upsert failed', e);
    return json({ ok: false, error: 'Could not save scores' }, 500);
  }

  const verdict = await rubricPassed(env, learner_id);
  return json({
    ok: true,
    saved: valid.length,
    rejected: rejected.length ? rejected : undefined,
    verdict,
  });
}
