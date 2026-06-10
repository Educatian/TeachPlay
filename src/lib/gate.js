/**
 * The credential-minting gate, in one place.
 *
 * A claim token / claim code may only be minted for a learner when BOTH:
 *   (1) session completion passes — all 12 sessions click-through complete
 *       (the PREREQUISITE-TO-SUBMIT signal), AND
 *   (2) the rubric verdict passes — an evidence submission exists for all five
 *       deliverables AND every one of the 25 criteria is at Proficient or above
 *       (non-compensatory).
 *
 * FEATURE-DETECT: if the evidence/rubric tables (migration 0008) do not exist
 * yet, the rubric verdict is "not applicable" and the gate falls back to the
 * CURRENT behavior (completion-only), so deploying this code before applying
 * the SQL does not brick issuance. Once the tables exist, the full gate is
 * enforced.
 *
 * This module is about the assessment GATE only — it never touches credential
 * signing, the OB v3 / VC schema, or key material.
 */

import { rubricPassed } from './rubric.js';
import { postSurveyGateActive, postSurveyCompleted } from './survey-gate.js';

const REQUIRED_SESSIONS = 12;

async function completionCount(env, learner_id) {
  try {
    const row = await env.DB.prepare(
      `SELECT COUNT(DISTINCT activity_id) AS cnt FROM xapi_events
       WHERE learner_id = ? AND verb = 'completed' AND activity_type = 'session'`
    ).bind(learner_id).first();
    return row ? Number(row.cnt) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * Returns { ok, reason, completion: {count, complete}, rubric: <verdict> }.
 *   ok=true  → safe to mint.
 *   ok=false → refuse; `reason` is a learner-readable explanation.
 */
export async function evaluateCredentialGate(env, learner_id) {
  const count = await completionCount(env, learner_id);
  const completionComplete = count >= REQUIRED_SESSIONS;

  const verdict = await rubricPassed(env, learner_id);

  // ADDITIONAL claim-time condition: the POST completion survey must be
  // submitted before the certificate can be claimed. Feature-detected — the
  // gate is INACTIVE (skipped) unless the survey-gate columns (migration 0010)
  // exist AND the QUALTRICS_* secrets are set, so the live class is never
  // locked out by deploy alone. This does NOT touch rubricPassed or signing;
  // it layers on top of whichever assessment branch (completion-only or full
  // rubric) is in force, so it applies the moment a learner would otherwise be
  // clear to claim.
  const surveyActive = await postSurveyGateActive(env);
  const surveyDone = surveyActive ? await postSurveyCompleted(env, learner_id) : null;
  const surveyState = { active: surveyActive, completed: surveyActive ? surveyDone : null };
  const surveyBlocks = surveyActive && !surveyDone;

  // Completion is the prerequisite-to-submit signal; it must hold regardless.
  if (!completionComplete) {
    return {
      ok: false,
      reason: `sessions incomplete: ${count}/${REQUIRED_SESSIONS} completed`,
      completion: { count, complete: false },
      rubric: verdict,
      survey: surveyState,
    };
  }

  // Pre-migration: rubric tables absent → completion-only behavior (legacy).
  if (!verdict.applicable) {
    if (surveyBlocks) {
      return {
        ok: false,
        reason: 'post-program completion survey not submitted',
        completion: { count, complete: true },
        rubric: verdict,
        survey: surveyState,
      };
    }
    return {
      ok: true,
      reason: 'completion-only (rubric gate not yet enabled)',
      completion: { count, complete: true },
      rubric: verdict,
      survey: surveyState,
    };
  }

  if (!verdict.passed) {
    return {
      ok: false,
      reason: verdict.reason, // "portfolio not submitted" / "rubric incomplete: N/25" / ...
      completion: { count, complete: true },
      rubric: verdict,
      survey: surveyState,
    };
  }

  if (surveyBlocks) {
    return {
      ok: false,
      reason: 'post-program completion survey not submitted',
      completion: { count, complete: true },
      rubric: verdict,
      survey: surveyState,
    };
  }

  return {
    ok: true,
    reason: verdict.reason,
    completion: { count, complete: true },
    rubric: verdict,
    survey: surveyState,
  };
}
