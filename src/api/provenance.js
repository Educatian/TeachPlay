/**
 * GenAI Provenance Log — declared AI use per deliverable.
 *
 *   POST /api/provenance
 *        Body: { deliverable_id: "D1".."D5", tool_name?, prompt_text?,
 *                output_excerpt?, revision_note?, aias_level: 1..5 }
 *        Appends one provenance entry for the authenticated learner.
 *        Token-gated EXACTLY like /api/evidence: learner_id via the
 *        X-Learner-ID header (or body), plus the per-learner X-Learner-Token
 *        (legacy tokenless rows bind on first use, TOFU). Rate-limited.
 *
 *   GET  /api/provenance[?deliverable_id=D1]
 *        Returns the learner's OWN entries (same token gate).
 *
 *   GET  /api/admin/provenance?learner_id=<id>
 *        Instructor view — entries grouped by deliverable. checkAdminAuth-
 *        gated like /api/admin/evidence. Read-only, advisory: the log
 *        informs rubric review; it never feeds the credential gate.
 *
 * `aias_level` is the learner's declared level on the AI Assessment Scale
 * (Perkins, Furze, Roe & MacVaugh, 2024, doi 10.53761/q3azde36):
 *   1 No AI · 2 AI Planning · 3 AI Collaboration · 4 Full AI · 5 AI Exploration
 *
 * Feature-detected: if the provenance_entries table does not exist yet (code
 * deployed before migration 0013), POST returns 503 "provenance log not yet
 * enabled" so the client falls back to its localStorage draft, and GET returns
 * { enabled: false, entries: [] } — the same graceful-degrade contract as
 * /api/evidence for the 0008 tables. Best-effort, never 500 on a missing table.
 */

import { getClientIp, rateLimit, learnerTokenDecision } from '../lib/security.js';
import { DELIVERABLES } from '../lib/rubric.js';
import { checkAdminAuth } from '../lib/auth.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

// Hard caps so a single entry can never bloat D1 (schema stays unclamped by
// design — see migrations/0013_provenance_log.sql).
const MAX_TOOL_NAME      = 128;
const MAX_PROMPT_TEXT    = 16 * 1024;  // 16 KB — prompts are the evidence, keep them roomy
const MAX_OUTPUT_EXCERPT = 8 * 1024;   // 8 KB — an excerpt, not the whole output
const MAX_REVISION_NOTE  = 4 * 1024;

function cap(value, max) {
  if (value == null) return null;
  const s = typeof value === 'string' ? value : String(value);
  const t = s.trim();
  if (!t) return null;
  return t.length > max ? t.slice(0, max) : t;
}

const DELIVERABLE_SET = new Set(DELIVERABLES);
function normDeliverable(v) {
  const s = String(v == null ? '' : v).trim().toUpperCase();
  return DELIVERABLE_SET.has(s) ? s : null;
}

// Declared AIAS level must be an integer 1..5 — reject anything else so a
// mistyped declaration never lands as silent garbage in the instructor view.
function normAiasLevel(v) {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

async function tableExists(env) {
  try {
    const row = await env.DB.prepare(
      `SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name='provenance_entries'`
    ).first();
    return !!row;
  } catch {
    return false;
  }
}

// Shared learner authn for GET + POST — same policy as /api/evidence.
async function authenticateLearner(request, env, bodyLearnerId) {
  const learner_id = request.headers.get('x-learner-id') ||
    (bodyLearnerId != null ? String(bodyLearnerId).trim() : '');
  if (!learner_id) return { ok: false, res: json({ error: 'Missing learner id' }, 401) };

  const learner = await env.DB.prepare('SELECT id, session_token FROM learners WHERE id = ?')
    .bind(learner_id).first();
  if (!learner) return { ok: false, res: json({ error: 'Learner not found' }, 403) };

  const providedToken = request.headers.get('x-learner-token') || '';
  const decision = learnerTokenDecision(learner.session_token, providedToken);
  if (decision === 'reject') return { ok: false, res: json({ error: 'Invalid session token' }, 403) };
  if (decision === 'bind') {
    await env.DB.prepare('UPDATE learners SET session_token = ? WHERE id = ? AND session_token IS NULL')
      .bind(providedToken, learner_id).run();
  }
  return { ok: true, learner_id };
}

export async function handleProvenance(request, env) {
  if (!env.DB) return json({ error: 'DB not configured' }, 500);

  if (request.method === 'GET') {
    const limit = await rateLimit(env, 'provenance', getClientIp(request), 60, 60);
    if (!limit.ok) return json({ error: 'Too many requests' }, 429);

    const auth = await authenticateLearner(request, env, null);
    if (!auth.ok) return auth.res;

    // Pre-migration: degrade gracefully — the page keeps its localStorage view.
    if (!(await tableExists(env))) {
      return json({ ok: true, enabled: false, entries: [] });
    }

    const deliverable_id = normDeliverable(new URL(request.url).searchParams.get('deliverable_id'));
    const sql = deliverable_id
      ? `SELECT id, deliverable_id, seq, tool_name, prompt_text, output_excerpt, revision_note, aias_level, created_at
           FROM provenance_entries WHERE learner_id = ? AND deliverable_id = ?
           ORDER BY deliverable_id, seq, id`
      : `SELECT id, deliverable_id, seq, tool_name, prompt_text, output_excerpt, revision_note, aias_level, created_at
           FROM provenance_entries WHERE learner_id = ?
           ORDER BY deliverable_id, seq, id`;
    const stmt = deliverable_id
      ? env.DB.prepare(sql).bind(auth.learner_id, deliverable_id)
      : env.DB.prepare(sql).bind(auth.learner_id);

    try {
      const res = await stmt.all();
      return json({ ok: true, enabled: true, entries: res.results || [] });
    } catch (e) {
      console.error('provenance select failed', e);
      return json({ ok: false, error: 'Could not read provenance log' }, 500);
    }
  }

  if (request.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405);

  const limit = await rateLimit(env, 'provenance', getClientIp(request), 30, 60);
  if (!limit.ok) return json({ error: 'Too many requests' }, 429);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, 400); }
  if (!body || typeof body !== 'object') return json({ error: 'Object body required' }, 400);

  const auth = await authenticateLearner(request, env, body.learner_id);
  if (!auth.ok) return auth.res;

  // Validate BEFORE the feature-detect so a bad entry gets a 400 (fix your
  // input) rather than a 503 (feature off) on pre-migration deployments.
  const deliverable_id = normDeliverable(body.deliverable_id);
  if (!deliverable_id) {
    return json({ error: 'deliverable_id must be one of D1..D5' }, 400);
  }
  const aias_level = normAiasLevel(body.aias_level);
  if (aias_level == null) {
    return json({ error: 'aias_level must be an integer 1..5 (AI Assessment Scale)' }, 400);
  }

  const tool_name      = cap(body.tool_name, MAX_TOOL_NAME);
  const prompt_text    = cap(body.prompt_text, MAX_PROMPT_TEXT);
  const output_excerpt = cap(body.output_excerpt, MAX_OUTPUT_EXCERPT);
  const revision_note  = cap(body.revision_note, MAX_REVISION_NOTE);

  // Level 1 ("No AI") legitimately has nothing to transcribe; every other
  // declared level must carry at least one piece of actual provenance.
  if (aias_level > 1 && !tool_name && !prompt_text && !output_excerpt && !revision_note) {
    return json({ error: 'Provide at least one of tool_name, prompt_text, output_excerpt, revision_note' }, 400);
  }

  // Feature-detect: pre-migration, degrade gracefully so the class isn't blocked.
  if (!(await tableExists(env))) {
    return json({ ok: false, error: 'provenance log not yet enabled' }, 503);
  }

  try {
    // seq = next 1-based position within (learner, deliverable). Computed in
    // the INSERT itself so two rapid appends can't race a JS-side read.
    const INSERT = `
      INSERT INTO provenance_entries
        (learner_id, deliverable_id, seq, tool_name, prompt_text, output_excerpt, revision_note, aias_level, created_at)
      VALUES (?, ?,
        (SELECT COALESCE(MAX(seq), 0) + 1 FROM provenance_entries WHERE learner_id = ? AND deliverable_id = ?),
        ?, ?, ?, ?, ?, datetime('now'))`;
    const res = await env.DB.prepare(INSERT).bind(
      auth.learner_id, deliverable_id,
      auth.learner_id, deliverable_id,
      tool_name, prompt_text, output_excerpt, revision_note, aias_level,
    ).run();
    return json({
      ok: true,
      stored: deliverable_id,
      aias_level,
      id: res?.meta?.last_row_id ?? null,
    });
  } catch (e) {
    console.error('provenance insert failed', e);
    return json({ ok: false, error: 'Could not store provenance entry' }, 500);
  }
}

export async function handleAdminProvenance(request, env) {
  if (request.method !== 'GET') return json({ error: 'Method Not Allowed' }, 405);

  const limit = await rateLimit(env, 'admin', getClientIp(request), 30, 60);
  if (!limit.ok) return json({ error: 'Too many requests' }, 429);

  const auth = checkAdminAuth(request, env);
  if (!auth.ok) return json(auth.body, auth.code);

  if (!env.DB) return json({ error: 'DB not configured' }, 500);

  const learner_id = new URL(request.url).searchParams.get('learner_id');
  if (!learner_id) return json({ error: 'learner_id required' }, 400);

  // Pre-migration: return an empty grouped view so the admin UI renders.
  if (!(await tableExists(env))) {
    return json({ ok: true, enabled: false, learner_id, by_deliverable: {}, total: 0 });
  }

  try {
    const res = await env.DB.prepare(
      `SELECT id, deliverable_id, seq, tool_name, prompt_text, output_excerpt, revision_note, aias_level, created_at
         FROM provenance_entries WHERE learner_id = ?
         ORDER BY deliverable_id, seq, id`
    ).bind(learner_id).all();

    const by_deliverable = {};
    let total = 0;
    for (const row of (res.results || [])) {
      (by_deliverable[row.deliverable_id] ||= []).push(row);
      total++;
    }
    return json({ ok: true, enabled: true, learner_id, by_deliverable, total });
  } catch (e) {
    console.error('admin-provenance select failed', e);
    return json({ ok: false, error: 'Could not read provenance log' }, 500);
  }
}
