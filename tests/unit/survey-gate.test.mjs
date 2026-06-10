// Unit coverage for the survey-gated credentialing layer (src/lib/survey-gate.js).
// Pure logic + a mocked Qualtrics fetch + a mocked D1 — no Worker runtime.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  signSurveyToken,
  verifySurveyToken,
  qualtricsVerifyResponse,
  surveyGateColumnsPresent,
  consentGateActive,
  postSurveyGateActive,
  recordSurvey,
  postSurveyCompleted,
} from '../../src/lib/survey-gate.js';

const SECRET = 'Tide2026Roll';

// ---- HMAC sig round-trip ---------------------------------------------------

test('signSurveyToken: deterministic hex, differs by type and learner', async () => {
  const env = { WORKER_SECRET: SECRET };
  const a = await signSurveyToken(env, 'consent', 'L1');
  const b = await signSurveyToken(env, 'consent', 'L1');
  const c = await signSurveyToken(env, 'post', 'L1');
  const d = await signSurveyToken(env, 'consent', 'L2');
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.equal(a, b);          // deterministic
  assert.notEqual(a, c);       // type-bound
  assert.notEqual(a, d);       // learner-bound
});

test('signSurveyToken: falls back to ISSUER_API_KEY when WORKER_SECRET unset', async () => {
  const a = await signSurveyToken({ ISSUER_API_KEY: SECRET }, 'consent', 'L1');
  const b = await signSurveyToken({ WORKER_SECRET: SECRET }, 'consent', 'L1');
  assert.equal(a, b);
});

test('signSurveyToken: null when no secret / bad type', async () => {
  assert.equal(await signSurveyToken({}, 'consent', 'L1'), null);
  assert.equal(await signSurveyToken({ WORKER_SECRET: SECRET }, 'nope', 'L1'), null);
});

test('verifySurveyToken: matches valid sig, rejects forged learner', async () => {
  const env = { WORKER_SECRET: SECRET };
  const sig = await signSurveyToken(env, 'consent', 'L1');
  assert.equal(await verifySurveyToken(env, 'consent', 'L1', sig), true);
  // forged learner_id with L1's sig must fail
  assert.equal(await verifySurveyToken(env, 'consent', 'EVIL', sig), false);
  // wrong type must fail
  assert.equal(await verifySurveyToken(env, 'post', 'L1', sig), false);
  // missing sig
  assert.equal(await verifySurveyToken(env, 'consent', 'L1', ''), false);
});

test('verifySurveyToken: case-insensitive on the provided sig', async () => {
  const env = { WORKER_SECRET: SECRET };
  const sig = await signSurveyToken(env, 'consent', 'L1');
  assert.equal(await verifySurveyToken(env, 'consent', 'L1', sig.toUpperCase()), true);
});

// ---- feature-detect (gate off until columns + secrets present) -------------

function dbWithCols(cols) {
  return {
    prepare(sql) {
      return {
        bind() { return this; },
        async all() {
          if (/PRAGMA table_info/.test(sql)) {
            return { results: cols.map((name) => ({ name })) };
          }
          return { results: [] };
        },
        async first() { return null; },
        async run() { return {}; },
      };
    },
  };
}

test('surveyGateColumnsPresent: false pre-migration, true post-migration', async () => {
  assert.equal(await surveyGateColumnsPresent({ DB: dbWithCols(['id', 'email']) }), false);
  assert.equal(await surveyGateColumnsPresent({
    DB: dbWithCols(['id', 'consent_completed_at', 'survey_completed_at']),
  }), true);
  assert.equal(await surveyGateColumnsPresent({}), false); // no DB
});

test('consentGateActive / postSurveyGateActive: need BOTH columns AND secrets', async () => {
  const cols = dbWithCols(['consent_completed_at', 'survey_completed_at']);
  // columns present but no QUALTRICS secrets → INACTIVE (no lockout)
  assert.equal(await consentGateActive({ DB: cols }), false);
  assert.equal(await postSurveyGateActive({ DB: cols }), false);
  // secrets present but no columns → INACTIVE
  assert.equal(await consentGateActive({
    DB: dbWithCols(['id']), QUALTRICS_TOKEN: 'x', QUALTRICS_CONSENT_SID: 'SV_a',
  }), false);
  // both present → ACTIVE
  assert.equal(await consentGateActive({
    DB: cols, QUALTRICS_TOKEN: 'x', QUALTRICS_CONSENT_SID: 'SV_a',
  }), true);
  assert.equal(await postSurveyGateActive({
    DB: cols, QUALTRICS_TOKEN: 'x', QUALTRICS_POST_SID: 'SV_b',
  }), true);
});

// ---- Qualtrics verification (mocked fetch) ---------------------------------

function withFetch(fn, body) {
  const orig = globalThis.fetch;
  globalThis.fetch = fn;
  return () => { globalThis.fetch = orig; };
}

test('qualtricsVerifyResponse: unconfigured when token/sid missing', async () => {
  const r = await qualtricsVerifyResponse({}, { sid: '', rid: 'R1' });
  assert.equal(r.ok, false);
  assert.equal(r.status, 'unconfigured');
});

test('qualtricsVerifyResponse: not_found on 404 (latency hint)', async () => {
  const restore = withFetch(async () => ({ status: 404, ok: false }));
  try {
    const r = await qualtricsVerifyResponse(
      { QUALTRICS_TOKEN: 't' }, { sid: 'SV_a', rid: 'R1', expectedLearnerId: 'L1' });
    assert.equal(r.status, 'not_found');
  } finally { restore(); }
});

test('qualtricsVerifyResponse: not_finished when finished=0', async () => {
  const restore = withFetch(async () => ({
    status: 200, ok: true,
    json: async () => ({ result: { values: { finished: 0, learner_id: 'L1' } } }),
  }));
  try {
    const r = await qualtricsVerifyResponse(
      { QUALTRICS_TOKEN: 't' }, { sid: 'SV_a', rid: 'R1', expectedLearnerId: 'L1' });
    assert.equal(r.status, 'not_finished');
  } finally { restore(); }
});

test('qualtricsVerifyResponse: learner_mismatch when embedded id differs', async () => {
  const restore = withFetch(async () => ({
    status: 200, ok: true,
    json: async () => ({ result: { values: { finished: 1, learner_id: 'OTHER' } } }),
  }));
  try {
    const r = await qualtricsVerifyResponse(
      { QUALTRICS_TOKEN: 't' }, { sid: 'SV_a', rid: 'R1', expectedLearnerId: 'L1' });
    assert.equal(r.status, 'learner_mismatch');
  } finally { restore(); }
});

test('qualtricsVerifyResponse: ok when finished + learner matches', async () => {
  const restore = withFetch(async () => ({
    status: 200, ok: true,
    json: async () => ({ result: { values: { finished: 1, learner_id: 'L1' } } }),
  }));
  try {
    const r = await qualtricsVerifyResponse(
      { QUALTRICS_TOKEN: 't' }, { sid: 'SV_a', rid: 'R1', expectedLearnerId: 'L1' });
    assert.equal(r.ok, true);
    assert.equal(r.finished, true);
    assert.equal(r.learner_id, 'L1');
  } finally { restore(); }
});

// ---- completion recording (mocked D1) --------------------------------------

test('recordSurvey: writes timestamp + rid, postSurveyCompleted reads it', async () => {
  const store = { survey_completed_at: null, survey_response_id: null };
  const cols = ['consent_completed_at', 'survey_completed_at'];
  const env = {
    QUALTRICS_TOKEN: 't', QUALTRICS_POST_SID: 'SV_b',
    DB: {
      prepare(sql) {
        return {
          _sql: sql, _args: [],
          bind(...a) { this._args = a; return this; },
          async all() {
            if (/PRAGMA table_info/.test(sql)) return { results: cols.map((name) => ({ name })) };
            return { results: [] };
          },
          async first() {
            if (/survey_completed_at FROM learners/.test(sql)) {
              return { survey_completed_at: store.survey_completed_at };
            }
            return null;
          },
          async run() {
            if (/UPDATE learners/.test(sql) && /survey_completed_at/.test(sql)) {
              store.survey_completed_at = store.survey_completed_at || '2026-06-10T00:00:00Z';
              store.survey_response_id = store.survey_response_id || this._args[0];
            }
            return {};
          },
        };
      },
    },
  };

  assert.equal(await postSurveyCompleted(env, 'L1'), false);  // before
  const wrote = await recordSurvey(env, 'L1', 'R_123');
  assert.equal(wrote, true);
  assert.equal(store.survey_response_id, 'R_123');
  assert.equal(await postSurveyCompleted(env, 'L1'), true);   // after
});

test('recordSurvey: no-op (false) pre-migration', async () => {
  const env = { DB: dbWithCols(['id', 'email']) };
  assert.equal(await recordSurvey(env, 'L1', 'R_1'), false);
});
