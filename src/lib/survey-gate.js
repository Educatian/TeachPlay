/**
 * Survey-gated credentialing helpers for the teachplay Worker.
 *
 * GATE POLICY = completion/submission, NOT consent-yes. Submitting either
 * Qualtrics form (PRE consent, POST completion) passes the gate. The
 * research-data-use questions inside the forms are OPT-IN and never block.
 *
 * Two touchpoints:
 *   PRE  consent  → gates program START   (learner can't begin sessions)
 *   POST survey   → gates certificate CLAIM (learner can't claim the cert)
 *
 * This module owns:
 *   - signSurveyToken / verifySurveyToken : HMAC-SHA256 over `${type}:${learner_id}`
 *     so the Qualtrics return URL (?learner_id&sig) cannot be forged. Secret is
 *     WORKER_SECRET, falling back to ISSUER_API_KEY so the gate works on the live
 *     Worker before a dedicated secret is set.
 *   - qualtricsVerifyResponse : confirm a Qualtrics response exists, is Finished,
 *     and carries the matching embedded learner_id (server-to-server, token never
 *     leaves the Worker).
 *   - surveyGateColumnsPresent : feature-detect migration 0010 so the gate is
 *     INACTIVE (current behavior) until both the columns AND the QUALTRICS_*
 *     secrets are configured — the live class is never locked out by deploy alone.
 *
 * It never touches credential signing, the OB v3 / VC schema, key material, or
 * the rubricPassed logic. The certificate gate is an ADDITIONAL claim-time
 * condition layered on top of evaluateCredentialGate.
 */
import { timingSafeEqualStr } from './auth.js';

const TYPES = new Set(['consent', 'post']);

function secretFor(env) {
  // Prefer a dedicated WORKER_SECRET; fall back to ISSUER_API_KEY (already set
  // live) so signed links round-trip without a new secret being provisioned.
  return env.WORKER_SECRET || env.ISSUER_API_KEY || null;
}

function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * HMAC-SHA256(`${type}:${learner_id}`) → lowercase hex.
 * Returns null if the secret is unset (gate then feature-detects off upstream).
 */
export async function signSurveyToken(env, type, learner_id) {
  const secret = secretFor(env);
  if (!secret) return null;
  if (!TYPES.has(type) || !learner_id) return null;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${type}:${learner_id}`));
  return toHex(mac);
}

/** Constant-time verify that `sig` matches HMAC(type+":"+learner_id). */
export async function verifySurveyToken(env, type, learner_id, sig) {
  const expected = await signSurveyToken(env, type, learner_id);
  if (!expected || !sig) return false;
  return timingSafeEqualStr(String(sig).toLowerCase(), expected);
}

/**
 * Confirm a Qualtrics response is real, Finished, and tied to this learner.
 *
 * Server-to-server GET /API/v3/surveys/{sid}/responses/{rid}. Returns:
 *   { ok:true, finished, learner_id }                    on a confirmed match
 *   { ok:false, status:'not_found' }                     response not yet visible (latency)
 *   { ok:false, status:'not_finished' }                  response exists but incomplete
 *   { ok:false, status:'learner_mismatch' }              embedded learner_id != expected
 *   { ok:false, status:'unconfigured' }                  QUALTRICS_* secrets absent
 *   { ok:false, status:'error', detail }                 transport/API error
 *
 * Qualtrics records responses with a few seconds' latency, so 'not_found' is a
 * retry hint, not a hard failure.
 */
export async function qualtricsVerifyResponse(env, { sid, rid, expectedLearnerId }) {
  const token = env.QUALTRICS_TOKEN;
  const dc = env.QUALTRICS_DC || 'az1';
  if (!token || !sid) return { ok: false, status: 'unconfigured' };
  if (!rid) return { ok: false, status: 'not_found' };

  const url = `https://${dc}.qualtrics.com/API/v3/surveys/${encodeURIComponent(sid)}/responses/${encodeURIComponent(rid)}`;
  let res;
  try {
    res = await fetch(url, { headers: { 'X-API-TOKEN': token, accept: 'application/json' } });
  } catch (e) {
    return { ok: false, status: 'error', detail: String(e) };
  }
  if (res.status === 404) return { ok: false, status: 'not_found' };
  if (!res.ok) return { ok: false, status: 'error', detail: `HTTP ${res.status}` };

  let body;
  try { body = await res.json(); } catch { return { ok: false, status: 'error', detail: 'bad json' }; }

  const result = body && body.result ? body.result : null;
  if (!result) return { ok: false, status: 'not_found' };

  // Qualtrics latency: the response row can exist before it is fully recorded.
  const values = result.values || {};
  const finished = values.finished === 1 || values.finished === true ||
                   result.finished === true;
  if (!finished) return { ok: false, status: 'not_finished' };

  // Embedded learner_id lands in values.learner_id (single-survey export tag).
  const embedded = values.learner_id != null ? String(values.learner_id) : '';
  if (expectedLearnerId && embedded && embedded !== String(expectedLearnerId)) {
    return { ok: false, status: 'learner_mismatch', learner_id: embedded };
  }
  return { ok: true, finished: true, learner_id: embedded || String(expectedLearnerId || '') };
}

/**
 * Feature-detect migration 0010. Returns true only when the survey-gate columns
 * exist on `learners`. Until then the gate stays INACTIVE so deploying this code
 * before applying the SQL never bricks the live program.
 */
export async function surveyGateColumnsPresent(env) {
  if (!env.DB) return false;
  try {
    const rows = await env.DB.prepare(`PRAGMA table_info(learners)`).all();
    const cols = new Set((rows.results || []).map((r) => r.name));
    return cols.has('consent_completed_at') && cols.has('survey_completed_at');
  } catch {
    return false;
  }
}

/** PRE consent gate active = columns present AND consent survey configured. */
export async function consentGateActive(env) {
  if (!env.QUALTRICS_TOKEN || !env.QUALTRICS_CONSENT_SID) return false;
  return surveyGateColumnsPresent(env);
}

/** POST survey gate active = columns present AND post survey configured. */
export async function postSurveyGateActive(env) {
  if (!env.QUALTRICS_TOKEN || !env.QUALTRICS_POST_SID) return false;
  return surveyGateColumnsPresent(env);
}

/** Has this learner completed the consent survey? Feature-detected. */
export async function consentCompleted(env, learner_id) {
  if (!(await surveyGateColumnsPresent(env)) || !learner_id) return false;
  try {
    const row = await env.DB.prepare(
      'SELECT consent_completed_at FROM learners WHERE id = ?'
    ).bind(learner_id).first();
    return !!(row && row.consent_completed_at);
  } catch { return false; }
}

/** Has this learner completed the post survey? Feature-detected. */
export async function postSurveyCompleted(env, learner_id) {
  if (!(await surveyGateColumnsPresent(env)) || !learner_id) return false;
  try {
    const row = await env.DB.prepare(
      'SELECT survey_completed_at FROM learners WHERE id = ?'
    ).bind(learner_id).first();
    return !!(row && row.survey_completed_at);
  } catch { return false; }
}

/** Record consent completion (idempotent — first write wins on the timestamp). */
export async function recordConsent(env, learner_id, response_id) {
  if (!(await surveyGateColumnsPresent(env))) return false;
  try {
    await env.DB.prepare(
      `UPDATE learners
         SET consent_completed_at = COALESCE(consent_completed_at, datetime('now')),
             consent_response_id  = COALESCE(consent_response_id, ?)
       WHERE id = ?`
    ).bind(response_id || null, learner_id).run();
    return true;
  } catch { return false; }
}

/** Record post-survey completion (idempotent). */
export async function recordSurvey(env, learner_id, response_id) {
  if (!(await surveyGateColumnsPresent(env))) return false;
  try {
    await env.DB.prepare(
      `UPDATE learners
         SET survey_completed_at = COALESCE(survey_completed_at, datetime('now')),
             survey_response_id  = COALESCE(survey_response_id, ?)
       WHERE id = ?`
    ).bind(response_id || null, learner_id).run();
    return true;
  } catch { return false; }
}
