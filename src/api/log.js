/**
 * POST /api/log/conversation — persist one AI exchange (prompt + response text).
 * POST /api/log/gameplay     — persist one minigame / lab interaction.
 *
 * Both are content-preserving research logs (see migration 0005). They are
 * gated by the same per-learner session token as /api/xapi: a bare learner_id
 * is not enough, so one learner cannot write logs against another's row.
 *
 * Bodies (JSON):
 *   conversation: { learner_id?, source, session_id?, lo_id?, model?,
 *                   system_prompt?, user_prompt, response?, ok?, error?, duration_ms? }
 *   gameplay:     { learner_id?, game, session_id?, event, detail?, correct?,
 *                   score_raw?, score_max? }
 * learner_id may also be supplied via the X-Learner-ID header (preferred).
 */

import { getClientIp, rateLimit, learnerTokenDecision } from '../lib/security.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

// Coerce to a string and hard-cap its length so a single log row can never be
// used to bloat D1 or smuggle a megabyte of text per request.
function cap(value, max) {
  if (value == null) return null;
  const s = typeof value === 'string' ? value : String(value);
  return s.length > max ? s.slice(0, max) : s;
}

function intOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}
function numOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function boolInt(v) {
  return v == null ? null : (v ? 1 : 0);
}

const SESSION_RE = /^s(0?[1-9]|1[0-2])$/; // s1..s12 / s01..s12, or null

export async function handleLog(request, env, ctx, kind) {
  if (request.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405);
  if (!env.DB) return json({ error: 'DB not configured' }, 500);

  const limit = await rateLimit(env, 'log', getClientIp(request), 120, 60);
  if (!limit.ok) return json({ error: 'Too many requests' }, 429);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ error: 'Object body required' }, 400);
  }

  const learner_id = request.headers.get('x-learner-id') ||
    (body.learner_id != null ? String(body.learner_id).trim() : '');
  if (!learner_id) return json({ error: 'Missing learner id' }, 401);

  const learner = await env.DB.prepare('SELECT id, session_token FROM learners WHERE id = ?')
    .bind(learner_id).first();
  if (!learner) return json({ error: 'Learner not found' }, 403);

  // Same per-learner token policy as /api/xapi (TOFU bind for legacy rows).
  const providedToken = request.headers.get('x-learner-token') || '';
  const decision = learnerTokenDecision(learner.session_token, providedToken);
  if (decision === 'reject') return json({ error: 'Invalid session token' }, 403);
  if (decision === 'bind') {
    await env.DB.prepare('UPDATE learners SET session_token = ? WHERE id = ? AND session_token IS NULL')
      .bind(providedToken, learner_id).run();
  }

  // Normalize a free-form session tag to s01..s12 or null so the column stays clean.
  const session_id = SESSION_RE.test(String(body.session_id || '')) ? String(body.session_id) : null;

  if (kind === 'conversation') {
    const user_prompt = cap(body.user_prompt, 16000);
    if (!user_prompt) return json({ error: 'user_prompt required' }, 400);
    await env.DB.prepare(
      `INSERT INTO ai_conversations
        (learner_id, source, session_id, lo_id, model, system_prompt, user_prompt, response, ok, error, duration_ms, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(
      learner_id,
      cap(body.source, 64) || 'touchpoint',
      session_id,
      cap(body.lo_id, 64),
      cap(body.model, 64),
      cap(body.system_prompt, 8000),
      user_prompt,
      cap(body.response, 16000),
      boolInt(body.ok),
      cap(body.error, 500),
      intOrNull(body.duration_ms),
    ).run();
    return json({ ok: true, stored: 'conversation' });
  }

  if (kind === 'gameplay') {
    const game = cap(body.game, 64);
    const event = cap(body.event, 64);
    if (!game || !event) return json({ error: 'game and event required' }, 400);
    let detail = null;
    if (body.detail != null) {
      try { detail = cap(typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail), 16000); }
      catch { detail = null; }
    }
    await env.DB.prepare(
      `INSERT INTO gameplay_events
        (learner_id, game, session_id, event, detail, correct, score_raw, score_max, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(
      learner_id, game, session_id, event, detail,
      boolInt(body.correct), numOrNull(body.score_raw), numOrNull(body.score_max),
    ).run();
    return json({ ok: true, stored: 'gameplay' });
  }

  return json({ error: 'Unknown log kind' }, 404);
}
