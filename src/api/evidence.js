/**
 * POST /api/evidence — ingest a learner's portfolio evidence packet into D1.
 *
 * The portfolio is the system of record for the credential. Until now the
 * evidence packet lived only in browser localStorage and was never reviewed;
 * this endpoint persists it server-side, one row per deliverable (D1..D5).
 *
 * Token-gated EXACTLY like /api/progress and /api/xapi: a bare learner_id is
 * not enough — the per-learner X-Learner-Token is required (legacy tokenless
 * rows bind on first use, TOFU). Rate-limited.
 *
 * Body (JSON) — flexible so the existing localStorage draft can be posted as-is:
 *   {
 *     learner_id?: string,            // also accepted via X-Learner-ID header
 *     deliverables: [
 *       { deliverable_id: "D1", content: {...}|"...",
 *         file?: { name, size, type, b64? } },
 *       ...
 *     ]
 *   }
 *   // OR a single { deliverable_id, content, file? } object.
 *
 * Feature-detected: if the evidence_submissions table does not exist yet
 * (code deployed before migration 0008), returns 503 "evidence intake not yet
 * enabled" so the client falls back to its localStorage-only behavior and the
 * live class is never blocked. Best-effort, never 500 on a missing table.
 */

import { getClientIp, rateLimit, learnerTokenDecision } from '../lib/security.js';
import { DELIVERABLES } from '../lib/rubric.js';
import { requireProductAccess } from '../lib/entitlements.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

// Hard caps so a single packet can never bloat D1.
const MAX_CONTENT_JSON = 64 * 1024;   // 64 KB of structured packet per deliverable
const MAX_FILE_B64     = 256 * 1024;  // ~256 KB inline file; larger files store metadata only

function cap(value, max) {
  if (value == null) return null;
  const s = typeof value === 'string' ? value : String(value);
  return s.length > max ? s.slice(0, max) : s;
}

function intOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

const DELIVERABLE_SET = new Set(DELIVERABLES);
function normDeliverable(v) {
  const s = String(v == null ? '' : v).trim().toUpperCase();
  return DELIVERABLE_SET.has(s) ? s : null;
}

async function tableExists(env) {
  try {
    const row = await env.DB.prepare(
      `SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name='evidence_submissions'`
    ).first();
    return !!row;
  } catch {
    return false;
  }
}

export async function handleEvidence(request, env) {
  if (request.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405);
  if (!env.DB) return json({ error: 'DB not configured' }, 500);

  const limit = await rateLimit(env, 'evidence', getClientIp(request), 30, 60);
  if (!limit.ok) return json({ error: 'Too many requests' }, 429);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON body' }, 400); }
  if (!body || typeof body !== 'object') return json({ error: 'Object body required' }, 400);

  const learner_id = request.headers.get('x-learner-id') ||
    (body.learner_id != null ? String(body.learner_id).trim() : '');
  if (!learner_id) return json({ error: 'Missing learner id' }, 401);

  const learner = await env.DB.prepare('SELECT id, session_token FROM learners WHERE id = ?')
    .bind(learner_id).first();
  if (!learner) return json({ error: 'Learner not found' }, 403);

  // Same per-learner token policy as /api/xapi and /api/progress.
  const providedToken = request.headers.get('x-learner-token') || '';
  const decision = learnerTokenDecision(learner.session_token, providedToken);
  if (decision === 'reject') return json({ error: 'Invalid session token' }, 403);
  if (decision === 'bind') {
    await env.DB.prepare('UPDATE learners SET session_token = ? WHERE id = ? AND session_token IS NULL')
      .bind(providedToken, learner_id).run();
  }

  // Paywall choke point. Building the reviewable credential portfolio is the
  // paid product; reading the handbook and taking the checks stay free. This is
  // DEFAULT-OPEN: when the paywall flag is off or the entitlements table is
  // absent, requireProductAccess returns applicable=false and submission
  // proceeds exactly as before — so the live cohort is never blocked until the
  // paywall is deliberately switched on (see src/lib/entitlements.js).
  const access = await requireProductAccess(env, learner_id, 'credential');
  if (access.applicable && !access.allowed) {
    return json({
      ok: false,
      error: 'This is the paid part of TeachPlay.',
      code: 'payment_required',
      reason: access.reason,
      detail: 'Reading the handbook and taking the checks is free. Submitting your credential portfolio for instructor review requires an upgrade.',
    }, 402);
  }

  // Feature-detect: pre-migration, degrade gracefully so the class isn't blocked.
  if (!(await tableExists(env))) {
    return json({ ok: false, error: 'evidence intake not yet enabled' }, 503);
  }

  // Accept either { deliverables: [...] } or a single deliverable object.
  const rawItems = Array.isArray(body.deliverables)
    ? body.deliverables
    : (body.deliverable_id ? [body] : []);
  if (!rawItems.length) return json({ error: 'No deliverables provided' }, 400);

  const items = [];
  const skipped = [];
  for (const it of rawItems) {
    if (!it || typeof it !== 'object') { skipped.push('(non-object)'); continue; }
    const deliverable_id = normDeliverable(it.deliverable_id);
    if (!deliverable_id) { skipped.push(String(it.deliverable_id)); continue; }

    let content_json = null;
    if (it.content != null) {
      try {
        const s = typeof it.content === 'string' ? it.content : JSON.stringify(it.content);
        content_json = cap(s, MAX_CONTENT_JSON);
      } catch { content_json = null; }
    }

    let file_name = null, file_size = null, file_type = null, file_b64 = null;
    const f = it.file;
    if (f && typeof f === 'object') {
      file_name = cap(f.name, 256);
      file_size = intOrNull(f.size);
      file_type = cap(f.type, 128);
      // Inline the bytes only when small enough; otherwise keep metadata + null.
      if (typeof f.b64 === 'string' && f.b64.length > 0 && f.b64.length <= MAX_FILE_B64) {
        file_b64 = f.b64;
      }
    }

    items.push({ deliverable_id, content_json, file_name, file_size, file_type, file_b64 });
  }

  if (!items.length) return json({ error: 'No valid deliverables (D1..D5) provided', skipped }, 400);

  // Upsert one row per deliverable (unique on learner_id, deliverable_id).
  const UPSERT = `
    INSERT INTO evidence_submissions
      (id, learner_id, deliverable_id, content_json, file_name, file_size, file_type, file_b64, submitted_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(learner_id, deliverable_id) DO UPDATE SET
      content_json = excluded.content_json,
      file_name    = excluded.file_name,
      file_size    = excluded.file_size,
      file_type    = excluded.file_type,
      file_b64     = excluded.file_b64,
      updated_at   = datetime('now')`;

  try {
    await env.DB.batch(items.map(i =>
      env.DB.prepare(UPSERT).bind(
        crypto.randomUUID(), learner_id, i.deliverable_id,
        i.content_json, i.file_name, i.file_size, i.file_type, i.file_b64,
      )
    ));
  } catch (e) {
    console.error('evidence upsert failed', e);
    return json({ ok: false, error: 'Could not store evidence' }, 500);
  }

  return json({
    ok: true,
    stored: items.map(i => i.deliverable_id),
    skipped: skipped.length ? skipped : undefined,
  });
}
