// Unit coverage for the closed-form psychometric statistics that run LIVE in the
// Worker. Each assertion uses a tiny fixture with a hand-checked expected value,
// so a regression in the formula (not just the plumbing) is caught.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mean, variance, pearson, itemAnalysis,
  cohenKappa, fleissKappa, gwetAC1,
  brierScore, expectedCalibrationError, goodmanKruskalGamma, calibrationSummary,
} from '../../src/lib/psychometrics.js';

const approx = (a, b, eps = 1e-3) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);

// ── moments ───────────────────────────────────────────────────────────────────
test('mean / variance basics', () => {
  approx(mean([1, 2, 3, 4]), 2.5);
  approx(variance([1, 2, 3, 4]), 1.25); // population variance: mean sq dev = (2.25+.25+.25+2.25)/4
  assert.equal(mean([]), null);
});

test('pearson: perfect, none, degenerate', () => {
  approx(pearson([1, 2, 3], [2, 4, 6]), 1);          // perfectly linear
  approx(pearson([1, 2, 3], [3, 2, 1]), -1);
  assert.equal(pearson([1, 1, 1], [1, 2, 3]), null); // zero variance → null
});

// ── item analysis: KR-20 + point-biserial on a hand-checked matrix ──────────────
test('itemAnalysis: p-values, KR-20, discrimination on a 4-person × 3-item matrix', () => {
  // Persons (rows), items (cols). Hand-pick a matrix with known column means.
  // item A: 3/4 correct (p=.75), item B: 2/4 (p=.5), item C: 1/4 (p=.25)
  const matrix = [
    [1, 1, 1], // total 3
    [1, 1, 0], // total 2
    [1, 0, 0], // total 1
    [0, 0, 0], // total 0
  ];
  const a = itemAnalysis(['A', 'B', 'C'], matrix);
  assert.equal(a.status, 'ok');
  assert.equal(a.n, 4);
  assert.equal(a.item_count, 3);
  approx(a.items[0].p_value, 0.75);
  approx(a.items[1].p_value, 0.5);
  approx(a.items[2].p_value, 0.25);

  // KR-20 = (k/(k-1))(1 - ΣpQ / Var(total)).
  //   ΣpQ = .75*.25 + .5*.5 + .25*.75 = .1875 + .25 + .1875 = .625
  //   totals = [3,2,1,0], mean 1.5, population var = (2.25+.25+.25+2.25)/4 = 1.25
  //   KR-20 = (3/2)(1 - .625/1.25) = 1.5 * (1 - .5) = 1.5 * .5 = .75
  approx(a.kr20, 0.75);
  approx(a.alpha, 0.75); // identical for dichotomous items

  // This matrix is a perfect Guttman scale → every item correlates positively
  // with the rest-score; all discriminations should be high & positive.
  for (const it of a.items) assert.ok(it.discrimination > 0.5, `disc ${it.discrimination}`);
});

test('itemAnalysis: flags too-easy / too-hard / low-discrimination', () => {
  // 5 persons; item E everyone gets right (p=1 → too-easy, degenerate disc),
  // item H everyone gets wrong (p=0 → too-hard), item G informative.
  const matrix = [
    [1, 0, 1],
    [1, 0, 1],
    [1, 0, 0],
    [1, 0, 0],
    [1, 0, 0],
  ];
  const a = itemAnalysis(['E', 'H', 'G'], matrix);
  assert.ok(a.items[0].flags.includes('too-easy'));
  assert.ok(a.items[1].flags.includes('too-hard'));
});

test('itemAnalysis: insufficient data → status insufficient (no throw)', () => {
  assert.equal(itemAnalysis(['A'], [[1]]).status, 'insufficient');
  assert.equal(itemAnalysis(['A', 'B'], [[1, 0], [0, 1]]).status, 'insufficient'); // N<3
});

// ── Cohen's κ ───────────────────────────────────────────────────────────────────
test("Cohen's kappa: perfect agreement = 1", () => {
  const a = ['P', 'D', 'E', 'P'];
  const r = cohenKappa(a, a, ['Emerging', 'Developing', 'Proficient', 'Exemplary'].map(x => x[0]));
  approx(r.kappa, 1);
});

test("Cohen's kappa: hand-checked 2x2", () => {
  // Classic example. Two raters, binary {Y,N}, n=10:
  //   both Y = 4, both N = 3 → agree 7 → po = .7
  //   rater1 Y = 5/10, rater2 Y = 6/10 ; pe = .5*.6 + .5*.4 = .3 + .2 = .5
  //   kappa = (.7-.5)/(1-.5) = .2/.5 = .4
  const a = ['Y', 'Y', 'Y', 'Y', 'Y', 'N', 'N', 'N', 'N', 'N']; // 5 Y
  const b = ['Y', 'Y', 'Y', 'Y', 'N', 'Y', 'N', 'N', 'N', 'Y']; // 6 Y
  // verify counts: agree where equal:
  //  idx0-3 YY (4), idx4 Y/N, idx5 N/Y, idx6-8 NN (3), idx9 N/Y → agree=7
  const r = cohenKappa(a, b, ['Y', 'N']);
  approx(r.po, 0.7);
  approx(r.pe, 0.5);
  approx(r.kappa, 0.4);
});

test("Cohen's kappa: insufficient on empty", () => {
  assert.equal(cohenKappa([], [], ['Y', 'N']).status, 'insufficient');
});

// ── Gwet's AC1 ───────────────────────────────────────────────────────────────────
test("Gwet's AC1: hand-checked on the same 2x2", () => {
  // Same a,b as above. po = .7.
  //  category prevalences (avg of both raters over 2n=20 ratings):
  //   Y: (5+6)/20 = .55 ; N: (5+4)/20 = .45
  //  pe = Σ π(1-π)/(q-1) = (.55*.45 + .45*.55)/(2-1) = .2475 + .2475 = .495
  //  AC1 = (.7-.495)/(1-.495) = .205/.505 ≈ .40594
  const a = ['Y', 'Y', 'Y', 'Y', 'Y', 'N', 'N', 'N', 'N', 'N'];
  const b = ['Y', 'Y', 'Y', 'Y', 'N', 'Y', 'N', 'N', 'N', 'Y'];
  const r = gwetAC1(a, b, ['Y', 'N']);
  approx(r.po, 0.7);
  approx(r.pe, 0.495);
  approx(r.ac1, 0.40594, 1e-3);
});

// ── Fleiss' κ ────────────────────────────────────────────────────────────────────
test("Fleiss' kappa: perfect agreement = 1", () => {
  // 3 subjects, 3 raters, 2 categories; all raters agree on each subject.
  const counts = [[3, 0], [0, 3], [3, 0]];
  const r = fleissKappa(counts, 3);
  approx(r.kappa, 1);
});

// ── calibration ──────────────────────────────────────────────────────────────────
test('Brier score: hand-checked', () => {
  // conf [.9,.1,.8,.2], outcome [1,0,0,0]
  // sq err = .01 + .01 + .64 + .04 = .70 → mean .175
  approx(brierScore([0.9, 0.1, 0.8, 0.2], [1, 0, 0, 0]), 0.175);
  assert.equal(brierScore([], []), null);
});

test('ECE: single perfectly-calibrated bin → 0', () => {
  // All confidences .5, half the outcomes 1 → bin acc .5 = bin conf .5 → ECE 0.
  const e = expectedCalibrationError([0.5, 0.5, 0.5, 0.5], [1, 0, 1, 0], 5);
  approx(e.ece, 0);
});

test('ECE: hand-checked two-bin case', () => {
  // conf .1 (x2) outcome 0,0 → bin0 acc 0 conf .1 |diff|=.1 weight 2/4
  // conf .9 (x2) outcome 1,1 → bin4 acc 1 conf .9 |diff|=.1 weight 2/4
  // ECE = .5*.1 + .5*.1 = .1
  const e = expectedCalibrationError([0.1, 0.1, 0.9, 0.9], [0, 0, 1, 1], 5);
  approx(e.ece, 0.1);
});

test('Goodman-Kruskal gamma: perfect rank association = 1', () => {
  // Higher confidence always co-occurs with correct (1).
  const g = goodmanKruskalGamma([0.2, 0.4, 0.6, 0.8], [0, 0, 1, 1]);
  approx(g.gamma, 1);
});

test('Goodman-Kruskal gamma: inverted = -1', () => {
  const g = goodmanKruskalGamma([0.8, 0.6, 0.4, 0.2], [0, 0, 1, 1]);
  approx(g.gamma, -1);
});

test('calibrationSummary: signed bias + rates', () => {
  // self [.9,.8,.5], measured [.5,.5,.5]
  // bias = ((.4)+(.3)+(0))/3 = .7/3 ≈ .2333 (overconfident)
  // over=2, under=0, exact=1
  const c = calibrationSummary([0.9, 0.8, 0.5], [0.5, 0.5, 0.5]);
  assert.equal(c.status, 'ok');
  approx(c.signed_bias, 0.2333, 1e-3);
  approx(c.overconfident_rate, 2 / 3);
  approx(c.wellcalibrated_rate, 1 / 3);
  assert.ok(c.brier != null);
});

test('calibrationSummary: insufficient on empty', () => {
  assert.equal(calibrationSummary([], []).status, 'insufficient');
});
