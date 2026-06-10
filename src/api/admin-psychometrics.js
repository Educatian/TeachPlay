/**
 * GET /api/admin/psychometrics — credential-VALIDITY analytics (closed-form).
 *
 * Admin-gated (same checkAdminAuth as /api/admin/analytics). Turns the platform's
 * descriptive aggregates into MEASURED psychometrics, computed entirely in plain
 * JS over the D1 rows — no libraries, no iterative fitting. Heavy/iterative
 * modeling (1PL/Rasch IRT, 2PL, bootstrap κ CIs) is deliberately OUT of scope
 * here; it runs offline in analysis/psychometrics.py over /api/admin/export.
 *
 * Sections (each degrades to {status:'insufficient', n} on small/empty data —
 * never a 500):
 *   1. quiz_item_analysis  — p-value, corrected point-biserial discrimination,
 *                            item flags, KR-20 / Cronbach's α, N, item count
 *   2. rubric              — per-criterion difficulty (% Proficient+), 4-level
 *                            distribution, inter-criterion redundancy flags, and
 *                            inter-rater reliability (Cohen's κ, Fleiss' κ,
 *                            Gwet's AC1) when ≥2 raters scored the same portfolio
 *   3. calibration         — self-assessment vs measured performance: signed
 *                            bias, over/under rates, Brier, ECE, Goodman-Kruskal
 *                            γ, and pre→post calibration shift
 *
 * READ-ONLY / observational. Touches no credential signing, no VC/OB schema, and
 * NOT rubricPassed / evaluateCredentialGate — the issuance gate is unchanged.
 */

import { checkAdminAuth } from '../lib/auth.js';
import { getClientIp, rateLimit } from '../lib/security.js';
import {
  LEVELS, PASS_LEVEL_INDEX, RUBRIC, ALL_CRITERION_IDS, levelMeetsPass,
  rubricTablesExist, ratersTableExists,
} from '../lib/rubric.js';
import {
  itemAnalysis, pearson, cohenKappa, fleissKappa, gwetAC1,
  calibrationSummary, round4,
} from '../lib/psychometrics.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

const METHODS_NOTE =
  'Closed-form classical psychometrics computed live in the Worker over de-identified ' +
  'D1 rows. Quiz item analysis uses dichotomous (0/1) item responses on complete cases; ' +
  'discrimination is the CORRECTED point-biserial (item vs total-minus-item), KR-20 ≡ ' +
  "Cronbach's α for 0/1 items (conventional reliability bar ≥0.70). Rubric difficulty is " +
  'the share of learners scored Proficient-or-higher per criterion; redundancy flags mark ' +
  'criteria that never/always pass. Inter-rater reliability requires ≥2 raters on the SAME ' +
  "portfolio: Cohen's κ (pairwise), Fleiss' κ (≥3 raters), Gwet's AC1 (prevalence-robust); " +
  'conventional adequacy bar κ/AC1 ≥0.60. Calibration matches each learner\'s self-assessment ' +
  '(0–4 → 0–1) against measured performance (quiz proportion correct, 0–1) and reports signed ' +
  'bias (self−measured; + = overconfident), Brier, ECE (5 bins), Goodman-Kruskal γ, and ' +
  'pre→post shift. Iterative IRT/Rasch + bootstrap κ CIs are computed OFFLINE from /api/admin/export.';

export async function handleAdminPsychometrics(request, env) {
  if (request.method !== 'GET') return json({ error: 'Method Not Allowed' }, 405);

  const limit = await rateLimit(env, 'admin', getClientIp(request), 30, 60);
  if (!limit.ok) return json({ error: 'Too many requests' }, 429);

  const auth = checkAdminAuth(request, env);
  if (!auth.ok) return json(auth.body, auth.code);

  if (!env.DB) return json({ error: 'DB not configured' }, 500);

  try {
    const [quiz, rubric, calibration] = await Promise.all([
      computeQuizItemAnalysis(env),
      computeRubricAnalytics(env),
      computeCalibration(env),
    ]);
    return json({
      ok: true,
      generated_at: new Date().toISOString(),
      methods_note: METHODS_NOTE,
      quiz_item_analysis: quiz,
      rubric,
      calibration,
    });
  } catch (e) {
    console.error('psychometrics failed', e);
    // Even on an unexpected error, never 500 the dashboard — degrade gracefully.
    return json({
      ok: false,
      error: 'psychometrics-degraded',
      note: 'An internal error occurred computing psychometrics; sections degraded.',
      quiz_item_analysis: { status: 'insufficient', n: 0 },
      rubric: { status: 'insufficient', n: 0 },
      calibration: { status: 'insufficient', n: 0 },
    }, 200);
  }
}

// ── 1. Quiz item analysis ─────────────────────────────────────────────────────

/**
 * Build a learner × item 0/1 matrix from answered/quiz-item events. When a
 * learner answered the same item id more than once we take the LAST attempt
 * (max id) so the matrix is one row per learner. Items kept are those answered
 * by all learners in the matrix (complete-case) to keep KR-20 well defined;
 * learners missing any kept item are dropped. We pick the item set that
 * maximises N×k informally by taking items answered by ≥ the modal coverage.
 */
async function computeQuizItemAnalysis(env) {
  const res = await env.DB.prepare(
    `SELECT learner_id, activity_id, success, id
       FROM xapi_events
      WHERE verb = 'answered' AND activity_type = 'quiz-item' AND success IS NOT NULL
      ORDER BY id ASC`
  ).all();
  const rows = res.results || [];
  if (rows.length < 6) return { status: 'insufficient', n: rows.length, note: 'too few item responses' };

  // last attempt per (learner, item)
  const byLearnerItem = new Map(); // key `${l}|${item}` -> 0/1
  const learners = new Set();
  const itemCoverage = new Map();  // item -> set of learners
  for (const r of rows) {
    const item = String(r.activity_id);
    const key = r.learner_id + '|' + item;
    byLearnerItem.set(key, r.success ? 1 : 0); // ordered by id asc → last wins
    learners.add(r.learner_id);
    if (!itemCoverage.has(item)) itemCoverage.set(item, new Set());
    itemCoverage.get(item).add(r.learner_id);
  }

  // Keep items answered by at least 60% of learners (or ≥3), then keep learners
  // who answered all kept items → a clean complete-case matrix.
  const L = [...learners];
  const minCov = Math.max(3, Math.ceil(0.6 * L.length));
  let keptItems = [...itemCoverage.entries()]
    .filter(([, set]) => set.size >= minCov)
    .map(([item]) => item)
    .sort();
  if (keptItems.length < 2) {
    // fall back: keep the most-covered items so we still try
    keptItems = [...itemCoverage.entries()]
      .sort((a, b) => b[1].size - a[1].size).slice(0, 8).map(([item]) => item).sort();
  }

  const matrix = [];
  for (const l of L) {
    const row = [];
    let complete = true;
    for (const item of keptItems) {
      const v = byLearnerItem.get(l + '|' + item);
      if (v == null) { complete = false; break; }
      row.push(v);
    }
    if (complete && row.length === keptItems.length) matrix.push(row);
  }

  if (matrix.length < 3 || keptItems.length < 2) {
    return { status: 'insufficient', n: matrix.length, item_count: keptItems.length,
      note: 'not enough learners answered a common item set' };
  }
  const analysis = itemAnalysis(keptItems, matrix);
  analysis.complete_case_learners = matrix.length;
  analysis.total_learners_with_items = L.length;
  return analysis;
}

// ── 2. Rubric analytics + IRR ─────────────────────────────────────────────────

async function computeRubricAnalytics(env) {
  if (!(await rubricTablesExist(env))) {
    return { status: 'insufficient', n: 0, note: 'rubric tables not enabled (migration 0008)' };
  }

  // Authoritative latest-per-criterion (same source rubricPassed reads).
  const scoreRes = await env.DB.prepare(
    'SELECT learner_id, criterion_id, level FROM rubric_scores'
  ).all();
  const scoreRows = (scoreRes.results || []).filter(r => ALL_CRITERION_IDS.includes(r.criterion_id));

  // Per-criterion distribution + difficulty.
  const perCriterion = {};
  for (const cid of ALL_CRITERION_IDS) {
    perCriterion[cid] = { criterion_id: cid, n: 0, dist: { Emerging: 0, Developing: 0, Proficient: 0, Exemplary: 0 }, proficient_or_higher: 0 };
  }
  // learner -> {cid: levelIndex} for inter-criterion correlation
  const byLearner = new Map();
  for (const r of scoreRows) {
    const c = perCriterion[r.criterion_id];
    if (!c || !LEVELS.includes(r.level)) continue;
    c.n += 1;
    c.dist[r.level] += 1;
    if (levelMeetsPass(r.level)) c.proficient_or_higher += 1;
    if (!byLearner.has(r.learner_id)) byLearner.set(r.learner_id, {});
    byLearner.get(r.learner_id)[r.criterion_id] = LEVELS.indexOf(r.level);
  }

  const criteria = [];
  for (const cid of ALL_CRITERION_IDS) {
    const c = perCriterion[cid];
    const difficulty = c.n ? round4(c.proficient_or_higher / c.n) : null; // % Proficient+
    const flags = [];
    if (c.n >= 3) {
      if (c.proficient_or_higher === c.n) flags.push('never-fails');   // always passes → low info
      if (c.proficient_or_higher === 0) flags.push('always-fails');
    }
    criteria.push({
      criterion_id: cid, n: c.n, difficulty,
      distribution: c.dist, flags,
    });
  }

  // Inter-criterion correlation summary over learners scored on ≥2 criteria.
  // We report the count of |r|≥0.9 redundant pairs as a redundancy signal.
  const redundant_pairs = [];
  const scoredCids = ALL_CRITERION_IDS.filter(cid => perCriterion[cid].n >= 3);
  const learnersArr = [...byLearner.values()];
  for (let i = 0; i < scoredCids.length; i++) {
    for (let j = i + 1; j < scoredCids.length; j++) {
      const a = [], b = [];
      for (const lv of learnersArr) {
        if (lv[scoredCids[i]] != null && lv[scoredCids[j]] != null) {
          a.push(lv[scoredCids[i]]); b.push(lv[scoredCids[j]]);
        }
      }
      if (a.length >= 3) {
        const r = pearson(a, b);
        if (r != null && Math.abs(r) >= 0.9) {
          redundant_pairs.push({ a: scoredCids[i], b: scoredCids[j], r: round4(r), n: a.length });
        }
      }
    }
  }

  const irr = await computeIRR(env);

  return {
    status: scoreRows.length ? 'ok' : 'insufficient',
    n_scored_rows: scoreRows.length,
    n_learners_scored: byLearner.size,
    criteria,
    redundant_pairs,
    irr,
  };
}

/**
 * Inter-rater reliability from rubric_scores_raters (migration 0009). Requires
 * ≥2 raters who scored the SAME portfolio (learner). Computes, over the set of
 * (learner, criterion) cells double-scored:
 *   - per-pair Cohen's κ + Gwet's AC1 for each rater pair,
 *   - Fleiss' κ overall when ≥3 raters scored a common set,
 *   - pooled overall κ/AC1 across all double-scored cells of the top pair.
 */
async function computeIRR(env) {
  if (!(await ratersTableExists(env))) {
    return { status: 'insufficient', note: 'needs ≥2 raters on the same portfolio (migration 0009 not enabled)' };
  }
  const res = await env.DB.prepare(
    'SELECT learner_id, criterion_id, scorer_email, level FROM rubric_scores_raters'
  ).all();
  const rows = (res.results || []).filter(r => ALL_CRITERION_IDS.includes(r.criterion_id) && LEVELS.includes(r.level));

  // raters present
  const raters = [...new Set(rows.map(r => r.scorer_email))];
  if (raters.length < 2) {
    return { status: 'insufficient', note: 'needs ≥2 raters on the same portfolio', raters: raters.length };
  }

  // cell -> {rater: level}
  const cell = new Map(); // `${learner}|${crit}` -> Map(rater->level)
  for (const r of rows) {
    const k = r.learner_id + '|' + r.criterion_id;
    if (!cell.has(k)) cell.set(k, new Map());
    cell.get(k).set(r.scorer_email, r.level);
  }

  // Pairwise Cohen's κ + Gwet AC1 over cells both raters scored.
  const pairwise = [];
  for (let i = 0; i < raters.length; i++) {
    for (let j = i + 1; j < raters.length; j++) {
      const a = [], b = [];
      for (const m of cell.values()) {
        const la = m.get(raters[i]), lb = m.get(raters[j]);
        if (la != null && lb != null) { a.push(la); b.push(lb); }
      }
      if (a.length >= 1) {
        pairwise.push({
          rater_a: raters[i], rater_b: raters[j],
          n_double_scored: a.length,
          cohen_kappa: cohenKappa(a, b, LEVELS),
          gwet_ac1: gwetAC1(a, b, LEVELS),
        });
      }
    }
  }
  if (!pairwise.length) {
    return { status: 'insufficient', note: 'raters exist but no portfolio was scored by ≥2 of them', raters: raters.length };
  }

  // Overall: pool all cells scored by ≥2 raters → take first two raters per cell
  // for a pooled Cohen/Gwet, and a Fleiss' κ when cells uniformly have R raters.
  const overallA = [], overallB = [];
  const fleissRows = [];
  let fleissR = null, fleissUniform = true;
  for (const m of cell.values()) {
    const entries = [...m.values()];
    if (entries.length >= 2) {
      overallA.push(entries[0]); overallB.push(entries[1]);
      // category-count row for Fleiss
      const counts = LEVELS.map(lv => entries.filter(x => x === lv).length);
      fleissRows.push(counts);
      if (fleissR == null) fleissR = entries.length;
      else if (fleissR !== entries.length) fleissUniform = false;
    }
  }
  const overall = {
    n_double_scored_cells: overallA.length,
    cohen_kappa: cohenKappa(overallA, overallB, LEVELS),
    gwet_ac1: gwetAC1(overallA, overallB, LEVELS),
    fleiss_kappa: (fleissR >= 3 && fleissUniform)
      ? fleissKappa(fleissRows, fleissR)
      : { status: 'insufficient', note: 'Fleiss needs ≥3 raters per cell, uniform' },
  };

  return {
    status: 'ok',
    raters,
    n_raters: raters.length,
    n_double_scored_cells: overallA.length,
    pairwise,
    overall,
  };
}

// ── 3. Metacognitive calibration ──────────────────────────────────────────────

/**
 * Match each learner's self-assessment (responded/self-assessment, score_raw on
 * 0..4 → /4) against measured performance (mean quiz proportion correct from
 * scored/quiz, score_raw/score_max → 0..1), pre and post. Self-assessment skills
 * and quiz topics are not 1:1, so the measured anchor is the learner's OVERALL
 * quiz proportion correct (documented in the response). Pre uses self/pre means;
 * post uses self/post means; the shift compares the two calibration biases.
 */
async function computeCalibration(env) {
  const [saRes, quizRes] = await Promise.all([
    env.DB.prepare(
      `SELECT learner_id, activity_id, score_raw, score_max
         FROM xapi_events
        WHERE verb = 'responded' AND activity_type = 'self-assessment' AND score_raw IS NOT NULL`
    ).all(),
    env.DB.prepare(
      `SELECT learner_id, score_raw, score_max
         FROM xapi_events
        WHERE verb = 'scored' AND activity_type = 'quiz' AND score_raw IS NOT NULL AND score_max > 0`
    ).all(),
  ]);

  // measured = mean quiz proportion correct per learner (0..1)
  const quizByLearner = new Map();
  for (const r of (quizRes.results || [])) {
    if (!quizByLearner.has(r.learner_id)) quizByLearner.set(r.learner_id, []);
    quizByLearner.get(r.learner_id).push(r.score_raw / r.score_max);
  }
  const measured = new Map();
  for (const [l, arr] of quizByLearner) measured.set(l, arr.reduce((a, b) => a + b, 0) / arr.length);

  // self pre/post = mean score_raw/4 per learner per phase (0..1)
  const prePer = new Map(), postPer = new Map();
  for (const r of (saRes.results || [])) {
    const aid = String(r.activity_id);
    const max = r.score_max > 0 ? r.score_max : 4;
    const v = r.score_raw / max;
    if (aid.startsWith('self-assessment/pre/')) push(prePer, r.learner_id, v);
    else if (aid.startsWith('self-assessment/post/')) push(postPer, r.learner_id, v);
  }

  const buildPairs = (selfMap) => {
    const self01 = [], meas01 = [];
    for (const [l, arr] of selfMap) {
      if (!measured.has(l)) continue;
      self01.push(arr.reduce((a, b) => a + b, 0) / arr.length);
      meas01.push(measured.get(l));
    }
    return { self01, meas01 };
  };

  const pre = buildPairs(prePer);
  const post = buildPairs(postPer);
  const preCal = calibrationSummary(pre.self01, pre.meas01);
  const postCal = calibrationSummary(post.self01, post.meas01);

  let shift = { status: 'insufficient', note: 'needs both pre and post calibration' };
  if (preCal.status === 'ok' && postCal.status === 'ok') {
    shift = {
      status: 'ok',
      bias_pre: preCal.signed_bias,
      bias_post: postCal.signed_bias,
      bias_change: round4(postCal.signed_bias - preCal.signed_bias), // toward 0 = better calibrated
      brier_pre: preCal.brier,
      brier_post: postCal.brier,
      brier_change: (preCal.brier != null && postCal.brier != null) ? round4(postCal.brier - preCal.brier) : null,
    };
  }

  const anyOk = preCal.status === 'ok' || postCal.status === 'ok';
  return {
    status: anyOk ? 'ok' : 'insufficient',
    n_learners_with_quiz: measured.size,
    measured_anchor: 'mean quiz proportion correct (0..1)',
    self_scale: 'self-assessment score_raw / score_max (0..1)',
    pre: preCal,
    post: postCal,
    shift,
  };
}

function push(map, key, v) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(v);
}
