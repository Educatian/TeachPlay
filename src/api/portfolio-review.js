/** Link submission + bounded agentic pre-review for portfolio prototypes. */
import { getClientIp, learnerTokenDecision, rateLimit } from '../lib/security.js';
import { checkAdminAuth } from '../lib/auth.js';

function checkPortfolioAdminAuth(request, env) {
  const accessEmail = (request.headers.get('CF-Access-Authenticated-User-Email') || '').trim().toLowerCase();
  const allowlist = String(env.ADMIN_ACCESS_EMAILS || '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean);
  if (accessEmail && allowlist.includes(accessEmail)) return { ok: true, via: 'cloudflare-access' };
  // Do not turn a missing Access session into a misleading server error when
  // this deployment intentionally has no issuer key configured.
  const suppliedCredential = request.headers.get('authorization') || request.headers.get('x-api-key');
  if (!suppliedCredential && !env.ISSUER_API_KEY) {
    return { ok: false, code: 401, body: { error: 'Cloudflare Access instructor session required. Sign in through the full page, then reload.' } };
  }
  return checkAdminAuth(request, env);
}

const MAX_URL = 2048;
const MAX_TEXT = 100_000;
const ALLOWED_HOSTS = [
  /^aistudio\.google\.com$/i,
  /(^|\.)googleusercontent\.com$/i,
  /(^|\.)github\.com$/i,
  /(^|\.)github\.io$/i,
  /(^|\.)pages\.dev$/i,
  /(^|\.)vercel\.app$/i,
  /(^|\.)netlify\.app$/i,
];

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}
function tableExists(env) {
  return env.DB.prepare("SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name='portfolio_reviews'").first().then(Boolean).catch(() => false);
}
function parseUrl(value) {
  try {
    const raw = String(value || '').trim();
    if (raw.length > MAX_URL) return null;
    const u = new URL(raw);
    if (u.protocol !== 'https:' || u.username || u.password || u.hostname.length > 253 || !ALLOWED_HOSTS.some((p) => p.test(u.hostname))) return null;
    u.hash = '';
    return u.toString().slice(0, MAX_URL);
  } catch { return null; }
}
function providerFor(url) {
  const host = new URL(url).hostname.toLowerCase();
  return host === 'aistudio.google.com' || host.endsWith('.googleusercontent.com') ? 'google-ai-studio' : 'web-prototype';
}
function stripHtml(html) {
  return html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT);
}
async function analyzeWithGemini(env, url, text) {
  const prompt = `You are a cautious computational artifact-analysis agent for the TeachPlay AI-Enhanced Educational Game Design microcredential. Analyze the Google AI Studio or hosted prototype as an artifact, not as a generic webpage. Focus on whether the computational design operationalizes the learner's stated learning objective: inspect the game loop/state machine, input-output behavior, rules, feedback, data/evidence traces, assessment alignment, accessibility, AI/provenance disclosures, and whether the implementation makes the intended learning observable. Distinguish claims from observable artifact evidence and identify what cannot be verified from a fetched preview. Never issue a credential and never claim final approval. Return JSON only with keys: learning_objective (string), computational_artifact_summary (string), observable_mechanics (array of strings), evidence_traces (array of strings), alignment_findings (array of strings), strengths (array of strings), risks (array of strings), evidence_questions (array of strings), recommended_status (one of needs_review or rejected), rubric_hints (array of objects with deliverable, rationale). Be conservative and flag missing evidence. URL: ${url}\nARTIFACT CONTENT:\n${text}`;
  let raw = '';
  let provider = 'gemini';
  if (env.GEMINI_API_KEY) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
    const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.1 } }) });
    if (!response.ok) throw new Error(`Gemini ${response.status}`);
    const data = await response.json();
    raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  } else if (env.OPENROUTER_API_KEY) {
    provider = 'openrouter';
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://teachplay.dev', 'X-Title': 'TeachPlay Computational Artifact Review' }, body: JSON.stringify({ model: env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001', messages: [{ role: 'system', content: 'Return valid JSON only. Never approve credentials.' }, { role: 'user', content: prompt }], temperature: 0.1, response_format: { type: 'json_schema', json_schema: { name: 'teachplay_artifact_review', strict: true, schema: { type: 'object', properties: { learning_objective: { type: 'string' }, computational_artifact_summary: { type: 'string' }, observable_mechanics: { type: 'array', items: { type: 'string' } }, evidence_traces: { type: 'array', items: { type: 'string' } }, alignment_findings: { type: 'array', items: { type: 'string' } }, strengths: { type: 'array', items: { type: 'string' } }, risks: { type: 'array', items: { type: 'string' } }, evidence_questions: { type: 'array', items: { type: 'string' } }, recommended_status: { type: 'string', enum: ['needs_review', 'rejected'] }, rubric_hints: { type: 'array', items: { type: 'object', properties: { deliverable: { type: 'string' }, rationale: { type: 'string' } }, required: ['deliverable', 'rationale'], additionalProperties: false } } }, required: ['learning_objective', 'computational_artifact_summary', 'observable_mechanics', 'evidence_traces', 'alignment_findings', 'strengths', 'risks', 'evidence_questions', 'recommended_status', 'rubric_hints'], additionalProperties: false } } } }) });
    if (!response.ok) throw new Error(`OpenRouter ${response.status}`);
    const data = await response.json();
    raw = data?.choices?.[0]?.message?.content || '';
  } else if (env.AI && typeof env.AI.run === 'function') {
    provider = 'cloudflare-workers-ai';
    const data = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', { messages: [{ role: 'system', content: 'Return valid JSON only. Never approve credentials.' }, { role: 'user', content: prompt }] });
    raw = data?.response || '';
  } else {
    return { status: 'needs_review', summary: 'Automated analysis is unavailable on this deployment.', strengths: [], risks: ['No AI provider is configured; instructor must review the link manually.'], evidence_questions: [], rubric_hints: [] };
  }
  let parsed;
  try { parsed = JSON.parse(raw); } catch { parsed = { summary: raw.slice(0, 4000), strengths: [], risks: ['AI returned non-JSON output; instructor verification required.'], evidence_questions: [], rubric_hints: [] }; }
  return { status: 'needs_review', provider, ...parsed };
}
async function fetchPreview(url) {
  let current = url;
  let response;
  for (let hop = 0; hop < 3; hop += 1) {
    response = await fetch(current, { redirect: 'manual', headers: { accept: 'text/html,text/plain;q=0.9' }, signal: AbortSignal.timeout(8000) });
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const next = parseUrl(new URL(response.headers.get('location') || '', current).toString());
    if (!next) throw new Error('Prototype redirected to a non-approved host');
    current = next;
  }
  if (!response.ok) throw new Error(`Prototype returned HTTP ${response.status}`);
  const type = response.headers.get('content-type') || '';
  if (!/text\/(html|plain)|application\/json/i.test(type)) throw new Error('Prototype link is not readable text/html or JSON');
  return stripHtml((await response.text()).slice(0, MAX_TEXT));
}
async function learnerAuth(request, env) {
  const url = new URL(request.url);
  const learner_id = (request.headers.get('x-learner-id') || url.searchParams.get('learner_id') || '').trim();
  if (!learner_id) return { error: json({ error: 'Missing learner id' }, 401) };
  const learner = await env.DB.prepare('SELECT id, session_token FROM learners WHERE id = ?').bind(learner_id).first();
  if (!learner) return { error: json({ error: 'Learner not found' }, 403) };
  const decision = learnerTokenDecision(learner.session_token, request.headers.get('x-learner-token') || '');
  if (decision === 'reject') return { error: json({ error: 'Invalid session token' }, 403) };
  return { learner_id, learner, decision };
}
export async function handlePortfolioReview(request, env, ctx) {
  if (!env.DB) return json({ error: 'DB not configured' }, 500);
  if (!(await tableExists(env))) return json({ error: 'portfolio review not enabled' }, 503);
  const limit = await rateLimit(env, 'portfolio-review', getClientIp(request), 20, 60);
  if (!limit.ok) return json({ error: 'Too many requests' }, 429);
  const auth = await learnerAuth(request, env);
  if (auth.error) return auth.error;
  if (auth.decision === 'bind') await env.DB.prepare('UPDATE learners SET session_token = ? WHERE id = ? AND session_token IS NULL').bind(request.headers.get('x-learner-token'), auth.learner_id).run();
  if (request.method === 'GET') {
    const rows = await env.DB.prepare('SELECT id, url, provider, status, analysis_json, error_message, submitted_at, updated_at, final_reviewed_at FROM portfolio_reviews WHERE learner_id = ? ORDER BY updated_at DESC LIMIT 20').bind(auth.learner_id).all();
    return json({ ok: true, reviews: (rows.results || []).map((r) => ({ ...r, analysis: r.analysis_json ? JSON.parse(r.analysis_json) : null })) });
  }
  if (request.method !== 'POST') return json({ error: 'GET or POST required' }, 405);
  let body; try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
  const url = parseUrl(body?.url);
  if (!url) return json({ error: 'Use an HTTPS link from Google AI Studio, GitHub, GitHub Pages, Cloudflare Pages, Vercel, or Netlify.' }, 400);
  const id = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO portfolio_reviews (id, learner_id, url, provider, status) VALUES (?, ?, ?, ?, 'analyzing')").bind(id, auth.learner_id, url, providerFor(url)).run();
  const work = (async () => {
    try {
      const text = await fetchPreview(url);
      const analysis = await analyzeWithGemini(env, url, text);
      await env.DB.prepare("UPDATE portfolio_reviews SET status = ?, analysis_json = ?, updated_at = datetime('now') WHERE id = ?").bind(analysis.status, JSON.stringify(analysis), id).run();
    } catch (error) {
      await env.DB.prepare("UPDATE portfolio_reviews SET status = 'needs_review', error_message = ?, updated_at = datetime('now') WHERE id = ?").bind(String(error.message || error).slice(0, 500), id).run();
    }
  })();
  if (ctx?.waitUntil) ctx.waitUntil(work); else await work;
  return json({ ok: true, id, status: 'analyzing', message: 'Link received. Automated pre-review will never issue a credential; an instructor must final-approve it.' }, 202);
}
export async function handleAdminPortfolioReview(request, env) {
  if (!['GET', 'POST'].includes(request.method)) return json({ error: 'GET or POST required' }, 405);
  const auth = checkPortfolioAdminAuth(request, env); if (!auth.ok) return json(auth.body, auth.code);
  if (!env.DB || !(await tableExists(env))) return json({ error: 'portfolio review not enabled' }, 503);
  if (request.method === 'GET') {
    const rows = await env.DB.prepare('SELECT id, learner_id, url, provider, status, analysis_json, error_message, created_at, updated_at, final_reviewed_at, final_reviewed_by FROM portfolio_reviews ORDER BY created_at DESC LIMIT 100').all();
    return json({ ok: true, reviews: (rows.results || []).map((row) => ({ ...row, analysis: row.analysis_json ? JSON.parse(row.analysis_json) : null })) });
  }
  let body; try { body = await request.json(); } catch { return json({ error: 'Invalid JSON body' }, 400); }
  const { id, action } = body || {};
  if (!id || !['final_approve', 'reject'].includes(action)) return json({ error: 'id and action (final_approve|reject) required' }, 400);
  const status = action === 'final_approve' ? 'approved' : 'rejected';
  const result = await env.DB.prepare("UPDATE portfolio_reviews SET status = ?, final_reviewed_at = datetime('now'), final_reviewed_by = 'admin', updated_at = datetime('now') WHERE id = ? AND status = 'needs_review'").bind(status, id).run();
  if (!result.meta?.changes) return json({ error: 'Review is not awaiting final instructor review' }, 409);
  return json({ ok: true, id, status, next: status === 'approved' ? 'Submit rubric scores, then use /api/admin/approve to issue the signed credential and badge.' : 'Learner must revise and resubmit.' });
}
export async function handleAdminStorage(request, env) {
  if (request.method !== 'GET') return json({ error: 'GET required' }, 405);
  const auth = checkAdminAuth(request, env); if (!auth.ok) return json(auth.body, auth.code);
  if (!env.DB) return json({ error: 'DB not configured' }, 500);
  const hasFiles = await tableExists(env);
  let files = { count: 0, bytes: 0 };
  if (hasFiles) {
    files = await env.DB.prepare('SELECT COUNT(*) AS count, COALESCE(SUM(file_size), 0) AS bytes FROM evidence_files').first();
  }
  const r2 = !!(env.EVIDENCE_BUCKET && typeof env.EVIDENCE_BUCKET.put === 'function');
  return json({ ok: true, backend: r2 ? 'r2' : 'd1-inline', r2_configured: r2, evidence_files_table: hasFiles, files: { count: Number(files.count) || 0, bytes: Number(files.bytes) || 0 }, limits: { max_upload_bytes: 100 * 1024 * 1024, max_without_r2_bytes: 1_400_000, note: r2 ? 'R2-backed uploads support the 100 MB application cap.' : 'R2 is not bound; inline D1 uploads are capped at about 1 MB. Enable EVIDENCE_BUCKET for production portfolio artifacts.' } });
}
