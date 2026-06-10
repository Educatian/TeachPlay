// Unit coverage for the assessment-gate verdict: the 25-criterion
// non-compensatory rubric and the completion+rubric credential gate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LEVELS, PASS_LEVEL, DELIVERABLES, ALL_CRITERION_IDS, TOTAL_CRITERIA,
  levelMeetsPass, isValidCriterionId, isValidLevel, rubricPassed,
} from '../../src/lib/rubric.js';
import { evaluateCredentialGate } from '../../src/lib/gate.js';

test('rubric shape: 25 criteria, 5 deliverables, 4 levels, Proficient pass bar', () => {
  assert.equal(TOTAL_CRITERIA, 25);
  assert.equal(ALL_CRITERION_IDS.length, 25);
  assert.equal(new Set(ALL_CRITERION_IDS).size, 25); // ids unique
  assert.deepEqual(DELIVERABLES, ['D1', 'D2', 'D3', 'D4', 'D5']);
  assert.deepEqual(LEVELS, ['Emerging', 'Developing', 'Proficient', 'Exemplary']);
  assert.equal(PASS_LEVEL, 'Proficient');
});

test('levelMeetsPass: Proficient and Exemplary pass; lower fails', () => {
  assert.equal(levelMeetsPass('Proficient'), true);
  assert.equal(levelMeetsPass('Exemplary'), true);
  assert.equal(levelMeetsPass('Developing'), false);
  assert.equal(levelMeetsPass('Emerging'), false);
  assert.equal(levelMeetsPass('bogus'), false);
});

test('validators reject unknown ids/levels', () => {
  assert.equal(isValidCriterionId('d1-learner-specificity'), true);
  assert.equal(isValidCriterionId('d9-not-real'), false);
  assert.equal(isValidLevel('Proficient'), true);
  assert.equal(isValidLevel('Mastery'), false);
});

// ── Fake D1 to drive rubricPassed / gate without a live database ─────────────
function fakeEnv({ tablesExist = true, submissions = [], scores = [], sessions = 0 }) {
  function prepare(sql) {
    return {
      bind() { return this; },
      async first() {
        if (/sqlite_master/.test(sql)) return { n: tablesExist ? 2 : 0 };
        if (/COUNT\(DISTINCT activity_id\)/.test(sql)) return { cnt: sessions };
        return null;
      },
    };
  }
  return {
    DB: {
      prepare,
      async batch(stmts) {
        // rubricPassed batches [submissions query, scores query] in that order.
        return [
          { results: submissions.map(d => ({ deliverable_id: d })) },
          { results: scores },
        ];
      },
    },
  };
}

const allFive = ['D1', 'D2', 'D3', 'D4', 'D5'];
const allProficient = ALL_CRITERION_IDS.map(id => ({ criterion_id: id, level: 'Proficient' }));

test('rubricPassed: not applicable when tables are absent (pre-migration)', async () => {
  const v = await rubricPassed(fakeEnv({ tablesExist: false }), 'L1');
  assert.equal(v.applicable, false);
  assert.equal(v.passed, false);
});

test('rubricPassed: all 5 submitted + all 25 Proficient => passes', async () => {
  const v = await rubricPassed(fakeEnv({ submissions: allFive, scores: allProficient }), 'L1');
  assert.equal(v.applicable, true);
  assert.equal(v.passed, true);
  assert.equal(v.proficient_count, 25);
});

test('rubricPassed: one Developing blocks (non-compensatory)', async () => {
  const scores = allProficient.map((s, i) => i === 0 ? { ...s, level: 'Developing' } : s);
  const v = await rubricPassed(fakeEnv({ submissions: allFive, scores }), 'L1');
  assert.equal(v.passed, false);
  assert.equal(v.proficient_count, 24);
  assert.match(v.reason, /24\/25/);
});

test('rubricPassed: missing a deliverable blocks even if scored', async () => {
  const v = await rubricPassed(fakeEnv({ submissions: ['D1', 'D2', 'D3', 'D4'], scores: allProficient }), 'L1');
  assert.equal(v.passed, false);
  assert.deepEqual(v.missing_deliverables, ['D5']);
});

test('rubricPassed: nothing submitted => "portfolio not submitted"', async () => {
  const v = await rubricPassed(fakeEnv({ submissions: [], scores: [] }), 'L1');
  assert.equal(v.passed, false);
  assert.match(v.reason, /not submitted/);
});

// ── Gate: completion AND rubric ──────────────────────────────────────────────
test('gate: sessions incomplete => refuse regardless of rubric', async () => {
  const g = await evaluateCredentialGate(fakeEnv({ sessions: 7, submissions: allFive, scores: allProficient }), 'L1');
  assert.equal(g.ok, false);
  assert.match(g.reason, /sessions incomplete/);
});

test('gate: pre-migration falls back to completion-only', async () => {
  const g = await evaluateCredentialGate(fakeEnv({ sessions: 12, tablesExist: false }), 'L1');
  assert.equal(g.ok, true);
  assert.match(g.reason, /completion-only/);
});

test('gate: complete sessions but rubric incomplete => refuse', async () => {
  const g = await evaluateCredentialGate(fakeEnv({ sessions: 12, submissions: [], scores: [] }), 'L1');
  assert.equal(g.ok, false);
  assert.match(g.reason, /not submitted/);
});

test('gate: complete sessions + full rubric => allow', async () => {
  const g = await evaluateCredentialGate(fakeEnv({ sessions: 12, submissions: allFive, scores: allProficient }), 'L1');
  assert.equal(g.ok, true);
  assert.equal(g.rubric.passed, true);
});
