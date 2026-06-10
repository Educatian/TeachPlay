/**
 * Closed-form psychometric statistics — pure JS, no libraries, no DB, no I/O.
 *
 * Everything here is a single-pass / closed-form computation cheap enough to run
 * inside a Cloudflare Worker on a class-sized cohort (tens of learners, dozens of
 * items). The architectural rule for this stack: the Worker computes only these
 * closed-form statistics + a de-identified export; ITERATIVE / heavy modeling
 * (1PL/Rasch IRT, 2PL, bootstrap κ CIs) lives OFFLINE in analysis/psychometrics.py.
 *
 * Each function is small, deterministic, and unit-tested against hand-checked
 * fixtures (tests/unit/psychometrics.test.mjs). They never throw on degenerate
 * input — they return null / a documented sentinel so callers can degrade to an
 * "insufficient data" state instead of a 500.
 *
 * Definitions used (all standard):
 *   p-value (item difficulty)        mean of 0/1 correctness for an item
 *   point-biserial discrimination    Pearson r(item 0/1, total score)
 *   KR-20                            (k/(k-1)) · (1 − Σ p_i q_i / Var(total))
 *   Cronbach's α                     (k/(k-1)) · (1 − Σ Var(item) / Var(total))
 *                                    (≡ KR-20 for dichotomous items)
 *   Cohen's κ                        (po − pe)/(1 − pe), two raters, nominal
 *   Fleiss' κ                        multi-rater fixed-category agreement
 *   Gwet's AC1                       chance-corrected, robust to prevalence
 *   Brier score                      mean (confidence − outcome)²
 *   ECE                              Σ (n_b/N)·|acc_b − conf_b| over bins
 *   Goodman-Kruskal γ                (C − D)/(C + D) over confidence×outcome
 */

// ── Basic moments ───────────────────────────────────────────────────────────

export function mean(xs) {
  if (!xs || !xs.length) return null;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

/** Population variance (divides by N). Returns null on empty. */
export function variance(xs) {
  const m = mean(xs);
  if (m == null) return null;
  let s = 0;
  for (const x of xs) s += (x - m) * (x - m);
  return s / xs.length;
}

/**
 * Pearson correlation. Returns null when either series has zero variance
 * (degenerate — e.g. an item everyone got right) so callers can flag it.
 */
export function pearson(xs, ys) {
  if (!xs || !ys || xs.length !== ys.length || xs.length < 2) return null;
  const mx = mean(xs), my = mean(ys);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return null;
  return sxy / Math.sqrt(sxx * syy);
}

// ── Classical item analysis ──────────────────────────────────────────────────

/**
 * Item analysis over a complete-case person × item matrix of 0/1 responses.
 *
 * @param {string[]} itemIds   length k
 * @param {number[][]} matrix  N rows, each length k, entries 0/1
 * @returns per-item { item_id, n, p_value, discrimination, flags[] } + test-level
 *          { n, item_count, kr20, alpha, mean_total } ; or {status:'insufficient'}
 *
 * Discrimination is the corrected point-biserial: item vs. total-minus-this-item,
 * which removes the part-whole inflation a raw item-vs-total correlation carries.
 */
export function itemAnalysis(itemIds, matrix) {
  const N = matrix.length;
  const k = itemIds.length;
  if (N < 3 || k < 2) return { status: 'insufficient', n: N, item_count: k };

  // Column sums and per-row totals.
  const totals = matrix.map(row => row.reduce((a, b) => a + b, 0));
  const meanTotal = mean(totals);

  const items = [];
  let sumPQ = 0; // Σ p_i (1 − p_i) for KR-20
  for (let j = 0; j < k; j++) {
    const col = matrix.map(row => row[j]);
    const p = mean(col);
    sumPQ += p * (1 - p);
    // Corrected point-biserial: correlate item with (total − item).
    const rest = matrix.map((row, i) => totals[i] - row[j]);
    let disc = pearson(col, rest);
    const flags = [];
    if (disc == null) flags.push('degenerate'); // no variance in item or rest
    else if (disc < 0.2) flags.push('low-discrimination');
    if (p < 0.15) flags.push('too-hard');
    if (p > 0.95) flags.push('too-easy');
    items.push({
      item_id: itemIds[j],
      n: N,
      p_value: round4(p),
      discrimination: disc == null ? null : round4(disc),
      flags,
    });
  }

  const varTotal = variance(totals);
  // KR-20 ≡ Cronbach's α for dichotomous items; both reported for the card.
  let kr20 = null;
  if (varTotal != null && varTotal > 0 && k > 1) {
    kr20 = (k / (k - 1)) * (1 - sumPQ / varTotal);
  }
  return {
    status: 'ok',
    n: N,
    item_count: k,
    mean_total: round4(meanTotal),
    kr20: kr20 == null ? null : round4(kr20),
    alpha: kr20 == null ? null : round4(kr20), // identical for 0/1 items
    items,
  };
}

// ── Agreement coefficients (IRR) ──────────────────────────────────────────────

/**
 * Cohen's κ for two raters over paired nominal codes.
 * @param {Array} a  rater-1 codes
 * @param {Array} b  rater-2 codes (same length, aligned)
 * @param {Array} categories  the fixed category set
 * @returns { kappa, po, pe, n } or {status:'insufficient', n}
 */
export function cohenKappa(a, b, categories) {
  if (!a || !b || a.length !== b.length || a.length < 1) {
    return { status: 'insufficient', n: a ? a.length : 0 };
  }
  const n = a.length;
  const cats = categories || [...new Set([...a, ...b])];
  let agree = 0;
  const m1 = new Map(), m2 = new Map();
  for (const c of cats) { m1.set(c, 0); m2.set(c, 0); }
  for (let i = 0; i < n; i++) {
    if (a[i] === b[i]) agree++;
    m1.set(a[i], (m1.get(a[i]) || 0) + 1);
    m2.set(b[i], (m2.get(b[i]) || 0) + 1);
  }
  const po = agree / n;
  let pe = 0;
  for (const c of cats) pe += (m1.get(c) / n) * (m2.get(c) / n);
  const kappa = pe === 1 ? 1 : (po - pe) / (1 - pe);
  return { kappa: round4(kappa), po: round4(po), pe: round4(pe), n };
}

/**
 * Fleiss' κ for ≥3 raters. Input is a subjects × categories COUNT matrix:
 * counts[i][c] = number of raters that assigned subject i to category c. Every
 * subject must be rated by the same number of raters (n_raters).
 * @returns { kappa, pbar, pe, n_subjects, n_raters } or {status:'insufficient'}
 */
export function fleissKappa(counts, n_raters) {
  const N = counts.length;
  if (N < 1 || n_raters < 2) return { status: 'insufficient', n_subjects: N };
  const k = counts[0].length;
  // Category marginal proportions p_c = (Σ_i n_ic) / (N · n_raters)
  const colSum = new Array(k).fill(0);
  let totalRatings = 0;
  for (const row of counts) {
    for (let c = 0; c < k; c++) { colSum[c] += row[c]; totalRatings += row[c]; }
  }
  if (totalRatings === 0) return { status: 'insufficient', n_subjects: N };
  const pc = colSum.map(s => s / (N * n_raters));
  // Per-subject agreement P_i = (Σ_c n_ic² − n_raters) / (n_raters(n_raters−1))
  let sumPi = 0;
  for (const row of counts) {
    let sq = 0;
    for (let c = 0; c < k; c++) sq += row[c] * row[c];
    sumPi += (sq - n_raters) / (n_raters * (n_raters - 1));
  }
  const pbar = sumPi / N;
  const pe = pc.reduce((a, p) => a + p * p, 0);
  const kappa = pe === 1 ? 1 : (pbar - pe) / (1 - pe);
  return { kappa: round4(kappa), pbar: round4(pbar), pe: round4(pe), n_subjects: N, n_raters };
}

/**
 * Gwet's AC1 for two raters over paired nominal codes — chance-corrected like
 * κ but with a prevalence-robust chance term, so it does not collapse when one
 * category dominates (the "κ paradox"). Categories must be supplied (the fixed
 * rubric levels) so the chance term is well defined even if a level is unused.
 * @returns { ac1, po, pe, n } or {status:'insufficient', n}
 */
export function gwetAC1(a, b, categories) {
  if (!a || !b || a.length !== b.length || a.length < 1) {
    return { status: 'insufficient', n: a ? a.length : 0 };
  }
  const n = a.length;
  const cats = categories || [...new Set([...a, ...b])];
  const q = cats.length;
  let agree = 0;
  const count = new Map();
  for (const c of cats) count.set(c, 0);
  for (let i = 0; i < n; i++) {
    if (a[i] === b[i]) agree++;
    count.set(a[i], (count.get(a[i]) || 0) + 1);
    count.set(b[i], (count.get(b[i]) || 0) + 1);
  }
  const po = agree / n;
  // π_c = average prevalence of category c across both raters; pe = (Σ π_c(1−π_c))/(q−1)
  let pe = 0;
  if (q > 1) {
    for (const c of cats) {
      const pi = count.get(c) / (2 * n);
      pe += pi * (1 - pi);
    }
    pe = pe / (q - 1);
  }
  const ac1 = pe === 1 ? 1 : (po - pe) / (1 - pe);
  return { ac1: round4(ac1), po: round4(po), pe: round4(pe), n };
}

// ── Metacognitive calibration ─────────────────────────────────────────────────

/**
 * Brier score = mean (confidence − outcome)² over matched pairs on a 0..1 scale.
 * Lower is better (0 = perfect). @returns number|null.
 */
export function brierScore(confidences, outcomes) {
  if (!confidences || !outcomes || confidences.length !== outcomes.length || !confidences.length) return null;
  let s = 0;
  for (let i = 0; i < confidences.length; i++) {
    const d = confidences[i] - outcomes[i];
    s += d * d;
  }
  return round4(s / confidences.length);
}

/**
 * Expected Calibration Error: bin confidences into `bins` equal-width buckets on
 * [0,1], then Σ (n_b/N)·|mean_outcome_b − mean_confidence_b|. Lower is better.
 * @returns { ece, bins:[{lo,hi,n,conf,acc}] } or null
 */
export function expectedCalibrationError(confidences, outcomes, bins = 5) {
  if (!confidences || !outcomes || confidences.length !== outcomes.length || !confidences.length) return null;
  const N = confidences.length;
  const buckets = Array.from({ length: bins }, (_, b) => ({
    lo: b / bins, hi: (b + 1) / bins, conf: [], acc: [],
  }));
  for (let i = 0; i < N; i++) {
    const c = Math.min(0.999999, Math.max(0, confidences[i]));
    let b = Math.floor(c * bins);
    if (b >= bins) b = bins - 1;
    buckets[b].conf.push(confidences[i]);
    buckets[b].acc.push(outcomes[i]);
  }
  let ece = 0;
  const out = buckets.map(bk => {
    const n = bk.conf.length;
    const conf = n ? mean(bk.conf) : null;
    const acc = n ? mean(bk.acc) : null;
    if (n) ece += (n / N) * Math.abs(acc - conf);
    return { lo: round4(bk.lo), hi: round4(bk.hi), n, conf: conf == null ? null : round4(conf), acc: acc == null ? null : round4(acc) };
  });
  return { ece: round4(ece), bins: out };
}

/**
 * Goodman-Kruskal γ: rank association between an ordinal confidence and a binary
 * (or ordinal) outcome. γ = (C − D)/(C + D) over all pairs, ties excluded.
 * +1 = confidence perfectly orders correctness; 0 = none; −1 = inverted.
 * O(n²) — fine for class-sized n. @returns { gamma, concordant, discordant, n } | null
 */
export function goodmanKruskalGamma(confidences, outcomes) {
  if (!confidences || !outcomes || confidences.length !== outcomes.length || confidences.length < 2) return null;
  const n = confidences.length;
  let C = 0, D = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dc = confidences[i] - confidences[j];
      const dou = outcomes[i] - outcomes[j];
      if (dc === 0 || dou === 0) continue; // tie on either axis → excluded
      if ((dc > 0) === (dou > 0)) C++; else D++;
    }
  }
  if (C + D === 0) return { gamma: null, concordant: C, discordant: D, n };
  return { gamma: round4((C - D) / (C + D)), concordant: C, discordant: D, n };
}

/**
 * Calibration summary over matched (self-confidence, measured-performance) pairs,
 * both already on 0..1. signed bias = mean(self − measured); +ve = overconfident.
 * `outcomesBinary` (self≥measured? not used here) — we report over/under rates by
 * sign of the per-pair residual. Brier/ECE/γ treat `measured` as the outcome.
 * @returns full block or {status:'insufficient', n}
 */
export function calibrationSummary(self01, measured01, bins = 5) {
  if (!self01 || !measured01 || self01.length !== measured01.length || self01.length < 1) {
    return { status: 'insufficient', n: self01 ? self01.length : 0 };
  }
  const n = self01.length;
  let over = 0, under = 0, exact = 0, biasSum = 0;
  for (let i = 0; i < n; i++) {
    const d = self01[i] - measured01[i];
    biasSum += d;
    if (d > 1e-9) over++; else if (d < -1e-9) under++; else exact++;
  }
  return {
    status: 'ok',
    n,
    signed_bias: round4(biasSum / n),       // + overconfident, − underconfident
    overconfident_rate: round4(over / n),
    underconfident_rate: round4(under / n),
    wellcalibrated_rate: round4(exact / n),
    brier: brierScore(self01, measured01),
    ece: expectedCalibrationError(self01, measured01, bins),
    gamma: goodmanKruskalGamma(self01, measured01),
  };
}

// ── helpers ───────────────────────────────────────────────────────────────────

export function round4(x) {
  if (x == null || Number.isNaN(x)) return null;
  return Math.round(x * 1e4) / 1e4;
}
