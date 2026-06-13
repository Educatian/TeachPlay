/**
 * Evidence FILE intake + facilitator download.
 *
 *   POST /api/evidence-file
 *        Stores one uploaded portfolio file for a learner. The browser sends the
 *        raw bytes as the request body; metadata travels in headers so we never
 *        double-encode the payload:
 *          X-Learner-ID     learner id (also accepted as ?learner_id=)
 *          X-Learner-Token  per-learner session token (same TOFU policy as /api/xapi)
 *          X-File-Name      encodeURIComponent(file.name)
 *          X-File-Type      MIME type
 *          X-Deliverable    optional D1..D5 hint
 *
 *        Bytes land in R2 (binding EVIDENCE_BUCKET) when that binding exists;
 *        otherwise they are stored inline in D1 (subject to D1's 2 MB per-row
 *        limit, so inline files are capped well below that). The choice is
 *        feature-detected, so enabling R2 later needs no code change.
 *
 *        Returns a Supabase-Storage-shaped success body ({ Id, Key }) because the
 *        React evidence editor's dropzone calls supabase-js, whose upload path is
 *        rerouted here by app/teachplay-evidence-upload.js. Matching the shape
 *        lets the editor's own "uploaded ✓" UI resolve unchanged.
 *
 *   GET  /api/admin/evidence-file?id=<fileId>
 *        Admin-gated (ISSUER_API_KEY) download/stream of a stored file so the
 *        facilitator can review the artifact while scoring the rubric.
 *
 * Feature-detected: if the evidence_files table is absent (migration 0011 not yet
 * applied) POST returns 503 so the dropzone shows an "intake not enabled" notice
 * instead of bricking — the same degrade-gracefully contract as /api/evidence.
 *
 * Nothing here touches credential signing, the VC/OB schema, or key material.
 */

import { getClientIp, rateLimit, learnerTokenDecision } from '../lib/security.js';
import { checkAdminAuth } from '../lib/auth.js';
import { DELIVERABLES } from '../lib/rubric.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

// Hard ceilings. R2 can hold large artifacts; D1 cannot — its per-row limit is
// 2 MB, so inline base64 is capped with headroom for the other columns.
const MAX_FILE_BYTES   = 25 * 1024 * 1024;   // absolute cap (any backend)
const MAX_D1_B64_CHARS = 1_400_000;          // ~1.05 MB original; safely under D1's 2 MB row cap

const DELIVERABLE_SET = new Set(DELIVERABLES);
function normDeliverable(v) {
  const s = String(v == null ? '' : v).trim().toUpperCase();
  return DELIVERABLE_SET.has(s) ? s : null;
}

function clampStr(value, max) {
  if (value == null) return null;
  const s = String(value);
  return s.length > max ? s.slice(0, max) : s;
}

// Bytes -> base64 without blowing the call stack on large inputs.
function bytesToBase64(bytes) {
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function tableExists(env) {
  try {
    const row = await env.DB.prepare(
      `SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name='evidence_files'`
    ).first();
    return !!row;
  } catch {
    return false;
  }
}

export async function handleEvidenceFile(request, env) {
  if (request.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405);
  if (!env.DB) return json({ error: 'DB not configured' }, 500);

  const limit = await rateLimit(env, 'evidence', getClientIp(request), 30, 60);
  if (!limit.ok) return json({ error: 'Too many requests' }, 429);

  const url = new URL(request.url);
  const learner_id = (request.headers.get('x-learner-id') || url.searchParams.get('learner_id') || '').trim();
  if (!learner_id) return json({ error: 'Missing learner id' }, 401);

  const learner = await env.DB.prepare('SELECT id, session_token FROM learners WHERE id = ?')
    .bind(learner_id).first();
  if (!learner) return json({ error: 'Learner not found' }, 403);

  // Same per-learner token policy as /api/xapi, /api/progress, /api/evidence.
  const providedToken = request.headers.get('x-learner-token') || '';
  const decision = learnerTokenDecision(learner.session_token, providedToken);
  if (decision === 'reject') return json({ error: 'Invalid session token' }, 403);
  if (decision === 'bind') {
    await env.DB.prepare('UPDATE learners SET session_token = ? WHERE id = ? AND session_token IS NULL')
      .bind(providedToken, learner_id).run();
  }

  // Feature-detect: pre-migration, degrade gracefully (dropzone shows a notice).
  if (!(await tableExists(env))) {
    return json({ ok: false, error: 'evidence file intake not yet enabled' }, 503);
  }

  let buf;
  try { buf = await request.arrayBuffer(); }
  catch { return json({ error: 'Could not read file body' }, 400); }
  const bytes = new Uint8Array(buf);
  if (bytes.length === 0) return json({ error: 'Empty file' }, 400);
  if (bytes.length > MAX_FILE_BYTES) {
    return json({ error: `File too large (max ${Math.floor(MAX_FILE_BYTES / 1024 / 1024)} MB)` }, 413);
  }

  let file_name = 'upload';
  const rawName = request.headers.get('x-file-name');
  if (rawName) { try { file_name = decodeURIComponent(rawName); } catch { file_name = rawName; } }
  file_name = clampStr(file_name, 256) || 'upload';
  const file_type = clampStr(request.headers.get('x-file-type'), 128);
  const deliverable_id = normDeliverable(request.headers.get('x-deliverable'));
  const id = crypto.randomUUID();

  // Prefer R2 when the binding is present; fall back to inline D1 storage.
  let storage, r2_key = null, file_b64 = null;
  if (env.EVIDENCE_BUCKET && typeof env.EVIDENCE_BUCKET.put === 'function') {
    const safeName = file_name.replace(/[^A-Za-z0-9._-]/g, '_');
    r2_key = `evidence/${learner_id}/${id}_${safeName}`;
    try {
      await env.EVIDENCE_BUCKET.put(r2_key, bytes, {
        httpMetadata: file_type ? { contentType: file_type } : undefined,
        customMetadata: { learner_id, file_name },
      });
    } catch (e) {
      console.error('evidence-file R2 put failed', e);
      return json({ error: 'Could not store file' }, 500);
    }
    storage = 'r2';
  } else {
    const b64 = bytesToBase64(bytes);
    if (b64.length > MAX_D1_B64_CHARS) {
      // No R2 on this deployment and the file is too big for inline D1 storage.
      // Fail loudly so the learner compresses or links the artifact instead of
      // silently "succeeding" with no stored bytes.
      return json({
        error: `File is ${(bytes.length / 1024 / 1024).toFixed(1)} MB. This deployment can store files up to about 1 MB. Please compress the file (or attach the prototype as a link), or ask the administrator to enable R2 storage.`,
      }, 413);
    }
    file_b64 = b64;
    storage = 'd1';
  }

  try {
    await env.DB.prepare(
      `INSERT INTO evidence_files
         (id, learner_id, deliverable_id, file_name, file_size, file_type, storage, r2_key, file_b64, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(id, learner_id, deliverable_id, file_name, bytes.length, file_type, storage, r2_key, file_b64).run();
  } catch (e) {
    console.error('evidence-file insert failed', e);
    // Best-effort cleanup of the R2 object if the row failed to record.
    if (storage === 'r2' && r2_key) { try { await env.EVIDENCE_BUCKET.delete(r2_key); } catch {} }
    return json({ error: 'Could not record file' }, 500);
  }

  // Supabase-Storage-shaped success so the rerouted dropzone resolves cleanly.
  return json({ ok: true, Id: id, Key: `evidence-uploads/${id}_${file_name}`, storage });
}

export async function handleAdminEvidenceFileDownload(request, env) {
  if (request.method !== 'GET') return json({ error: 'Method Not Allowed' }, 405);

  const limit = await rateLimit(env, 'admin', getClientIp(request), 60, 60);
  if (!limit.ok) return json({ error: 'Too many requests' }, 429);

  const auth = checkAdminAuth(request, env);
  if (!auth.ok) return json(auth.body, auth.code);

  if (!env.DB) return json({ error: 'DB not configured' }, 500);
  if (!(await tableExists(env))) return json({ error: 'evidence file intake not enabled' }, 503);

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'id required' }, 400);

  const row = await env.DB.prepare(
    'SELECT file_name, file_type, storage, r2_key, file_b64 FROM evidence_files WHERE id = ?'
  ).bind(id).first();
  if (!row) return json({ error: 'File not found' }, 404);

  const contentType = row.file_type || 'application/octet-stream';
  const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(row.file_name || 'evidence')}`;

  if (row.storage === 'r2') {
    if (!env.EVIDENCE_BUCKET || typeof env.EVIDENCE_BUCKET.get !== 'function') {
      return json({ error: 'R2 storage not bound on this Worker' }, 500);
    }
    const obj = await env.EVIDENCE_BUCKET.get(row.r2_key);
    if (!obj) return json({ error: 'Object missing from storage' }, 404);
    return new Response(obj.body, {
      headers: { 'content-type': contentType, 'content-disposition': disposition, 'cache-control': 'no-store' },
    });
  }

  if (!row.file_b64) return json({ error: 'No stored bytes for this file' }, 404);
  const bytes = base64ToBytes(row.file_b64);
  return new Response(bytes, {
    headers: { 'content-type': contentType, 'content-disposition': disposition, 'cache-control': 'no-store' },
  });
}
