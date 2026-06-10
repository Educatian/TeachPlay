// Certificate gate: the POST survey is an ADDITIONAL feature-detected claim-time
// condition on top of completion + rubric. Verifies it does NOT fire pre-migration
// and DOES block claim (only) when active + survey not submitted.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCredentialGate } from '../../src/lib/gate.js';

// A D1 stub: 12 completed sessions, rubric tables absent (completion-only),
// and configurable survey-gate state.
function makeEnv({ cols, surveyCompleted }) {
  return {
    QUALTRICS_TOKEN: cols.includes('survey_completed_at') ? 't' : undefined,
    QUALTRICS_POST_SID: cols.includes('survey_completed_at') ? 'SV_b' : undefined,
    DB: {
      prepare(sql) {
        return {
          _args: [],
          bind(...a) { this._args = a; return this; },
          async all() {
            if (/PRAGMA table_info/.test(sql)) return { results: cols.map((name) => ({ name })) };
            return { results: [] };
          },
          async first() {
            if (/COUNT\(DISTINCT activity_id\)/.test(sql)) return { cnt: 12 };
            // rubric tables absent → rubricPassed returns not-applicable
            if (/survey_completed_at FROM learners/.test(sql)) {
              return { survey_completed_at: surveyCompleted ? '2026-06-10T00:00:00Z' : null };
            }
            return null;
          },
          async run() { return {}; },
        };
      },
    },
  };
}

test('cert gate: pre-migration (no survey columns) → ok, survey gate inactive', async () => {
  const env = makeEnv({ cols: ['id', 'email'], surveyCompleted: false });
  const g = await evaluateCredentialGate(env, 'L1');
  assert.equal(g.ok, true);
  assert.equal(g.survey.active, false);
});

test('cert gate: active + survey NOT submitted → blocked at claim time', async () => {
  const env = makeEnv({
    cols: ['id', 'consent_completed_at', 'survey_completed_at'],
    surveyCompleted: false,
  });
  const g = await evaluateCredentialGate(env, 'L1');
  assert.equal(g.ok, false);
  assert.match(g.reason, /completion survey/i);
  assert.equal(g.survey.active, true);
  assert.equal(g.survey.completed, false);
});

test('cert gate: active + survey submitted → ok', async () => {
  const env = makeEnv({
    cols: ['id', 'consent_completed_at', 'survey_completed_at'],
    surveyCompleted: true,
  });
  const g = await evaluateCredentialGate(env, 'L1');
  assert.equal(g.ok, true);
  assert.equal(g.survey.active, true);
  assert.equal(g.survey.completed, true);
});
