/**
 * Canonical assessment rubric for the AI-enhanced Educational Game Design
 * microcredential — the single server-side source of truth for the 25 criteria,
 * the 4 levels, the pass bar, and the non-compensatory verdict.
 *
 * The criteria below are transcribed verbatim from rubrics.html (the published
 * canonical rubric: D1-D5, five criteria each, four levels with Proficient as
 * the PASS BAR). The ids are stable slugs derived from the deliverable + the
 * criterion label; they are NOT invented constructs — every label maps 1:1 to a
 * row in rubrics.html.
 *
 * Nothing here touches credential signing, the OB v3 / VC schema, or key
 * material. This module only defines the assessment GATE: what it means for a
 * learner's portfolio to have passed.
 */

// Order matters — it is the level ladder. Index 0 is lowest, 3 is highest.
export const LEVELS = ['Emerging', 'Developing', 'Proficient', 'Exemplary'];

// The credential floor. A criterion "passes" at this level or above.
export const PASS_LEVEL = 'Proficient';
export const PASS_LEVEL_INDEX = LEVELS.indexOf(PASS_LEVEL);

// The five deliverables that must each have a submitted evidence packet.
export const DELIVERABLES = ['D1', 'D2', 'D3', 'D4', 'D5'];

/**
 * The 25 criteria, grouped by deliverable. label/hint are taken verbatim from
 * the rubrics.html criterion cells (the <small> note becomes `hint`).
 */
export const RUBRIC = [
  {
    deliverable: 'D1',
    title: 'Design Problem Statement',
    criteria: [
      { id: 'd1-learner-specificity',  label: 'Learner specificity',     hint: 'Named, not "students"' },
      { id: 'd1-context-constraints',  label: 'Context constraints',     hint: 'Observable, not inferred' },
      { id: 'd1-measurable-shift',     label: 'Measurable shift',        hint: 'Verb, baseline, target' },
      { id: 'd1-evidence-of-problem',  label: 'Evidence of the problem', hint: 'Why now, not invented' },
      { id: 'd1-revision-response',    label: 'Revision response',       hint: 'Log + rationale' },
    ],
  },
  {
    deliverable: 'D2',
    title: 'Objective × Mechanic Crosswalk',
    criteria: [
      { id: 'd2-objective-specificity', label: 'Objective specificity', hint: 'Verb, condition, criterion' },
      { id: 'd2-mechanic-rationale',    label: 'Mechanic rationale',     hint: 'Why this, not another' },
      { id: 'd2-risk-identification',   label: 'Risk identification',    hint: 'Named, specific' },
      { id: 'd2-declined-alternative',  label: 'Declined alternative',   hint: 'The honesty column' },
      { id: 'd2-traceability-to-d1',    label: 'Traceability to D1',     hint: 'Constraint-linked' },
    ],
  },
  {
    deliverable: 'D3',
    title: 'Paper Prototype & Facilitator Guide',
    criteria: [
      { id: 'd3-playability',                 label: 'Playability',                   hint: 'Colleague-run, 5 min to loop' },
      { id: 'd3-loop-fidelity',               label: 'Loop fidelity',                 hint: 'Matches the D2 row' },
      { id: 'd3-facilitator-guide',           label: 'Facilitator guide completeness', hint: 'Setup · rules · edges · debrief' },
      { id: 'd3-artifact-quality',            label: 'Artifact quality',              hint: 'No placeholder play' },
      { id: 'd3-iteration-log',               label: 'Iteration log',                 hint: '3+ cycles' },
    ],
  },
  {
    deliverable: 'D4',
    title: 'Playtest Report',
    criteria: [
      { id: 'd4-protocol-design',             label: 'Protocol design',               hint: 'Target learners, consent' },
      { id: 'd4-evidence-base',               label: 'Evidence base',                 hint: 'Capture + traceability' },
      { id: 'd4-observation-vs-interpretation', label: 'Observation vs. interpretation', hint: 'Separated, labeled' },
      { id: 'd4-finding-taxonomy',            label: 'Finding taxonomy',              hint: 'Severity × domain' },
      { id: 'd4-revision-plan',               label: 'Revision plan',                 hint: 'Impact × effort, cut line' },
    ],
  },
  {
    deliverable: 'D5',
    title: 'Implementation Spec',
    criteria: [
      { id: 'd5-state-machine',               label: 'State machine',                 hint: 'One page, fully guarded' },
      { id: 'd5-event-feedback-map',          label: 'Event → feedback map',          hint: 'Every cell specified' },
      { id: 'd5-threejs-bridge',              label: 'Three.js bridge',               hint: 'Scene purpose, graph, budget' },
      { id: 'd5-coherence-d1-d4',             label: 'Coherence with D1–D4',          hint: 'Cited, not restated' },
      { id: 'd5-known-limits',                label: 'Known limits',                  hint: 'Above-the-line honesty' },
    ],
  },
];

// Flat list of all 25 criterion ids, in deliverable order.
export const ALL_CRITERION_IDS = RUBRIC.flatMap(d => d.criteria.map(c => c.id));
export const TOTAL_CRITERIA = ALL_CRITERION_IDS.length; // 25

const CRITERION_ID_SET = new Set(ALL_CRITERION_IDS);
export function isValidCriterionId(id) { return CRITERION_ID_SET.has(id); }
export function isValidLevel(level) { return LEVELS.includes(level); }

/** True when `level` meets or exceeds the Proficient pass bar. */
export function levelMeetsPass(level) {
  const i = LEVELS.indexOf(level);
  return i >= 0 && i >= PASS_LEVEL_INDEX;
}

/**
 * Feature-detect the 0008 tables on the live DB. Returns true once the
 * migration has been applied. Used so that deploying the gate code BEFORE
 * applying the SQL falls back to completion-only behavior instead of erroring.
 */
export async function rubricTablesExist(env) {
  if (!env || !env.DB) return false;
  try {
    const row = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM sqlite_master
       WHERE type='table' AND name IN ('evidence_submissions','rubric_scores')`
    ).first();
    return !!row && row.n >= 2;
  } catch {
    return false;
  }
}

/**
 * The verdict rule, in one place.
 *
 * rubricPassed(env, learner_id) resolves to:
 *   { applicable, passed, submitted_deliverables, missing_deliverables,
 *     scored_count, proficient_count, reason }
 *
 *   applicable=false  → the 0008 tables do not exist yet. Callers should fall
 *                       back to the pre-migration (completion-only) behavior.
 *   passed=true       → an evidence submission exists for ALL 5 deliverables
 *                       AND every one of the 25 criteria has a recorded level
 *                       at Proficient-or-higher (non-compensatory: no averaging,
 *                       no compensation across criteria).
 *
 * Never throws; on a DB error it reports applicable=false so issuance is not
 * bricked by a transient query failure.
 */
export async function rubricPassed(env, learner_id) {
  const base = {
    applicable: false,
    passed: false,
    submitted_deliverables: [],
    missing_deliverables: [...DELIVERABLES],
    scored_count: 0,
    proficient_count: 0,
    total_criteria: TOTAL_CRITERIA,
    reason: 'evidence/rubric tables not enabled',
  };
  if (!(await rubricTablesExist(env))) return base;

  try {
    const [subRes, scoreRes] = await env.DB.batch([
      env.DB.prepare(
        'SELECT DISTINCT deliverable_id FROM evidence_submissions WHERE learner_id = ?'
      ).bind(learner_id),
      env.DB.prepare(
        'SELECT criterion_id, level FROM rubric_scores WHERE learner_id = ?'
      ).bind(learner_id),
    ]);

    const submitted = new Set(
      (subRes.results || []).map(r => String(r.deliverable_id).toUpperCase())
    );
    const submitted_deliverables = DELIVERABLES.filter(d => submitted.has(d));
    const missing_deliverables = DELIVERABLES.filter(d => !submitted.has(d));

    // Best-of level per criterion (a re-score replaces in place via PK, but be
    // defensive and keep the highest if duplicates ever appear).
    const byCriterion = new Map();
    for (const row of (scoreRes.results || [])) {
      const cid = String(row.criterion_id);
      if (!CRITERION_ID_SET.has(cid)) continue; // ignore stale/unknown ids
      const prev = byCriterion.get(cid);
      if (prev == null || LEVELS.indexOf(row.level) > LEVELS.indexOf(prev)) {
        byCriterion.set(cid, row.level);
      }
    }

    let scored_count = 0;
    let proficient_count = 0;
    for (const cid of ALL_CRITERION_IDS) {
      const level = byCriterion.get(cid);
      if (level != null && isValidLevel(level)) {
        scored_count += 1;
        if (levelMeetsPass(level)) proficient_count += 1;
      }
    }

    const allSubmitted = missing_deliverables.length === 0;
    const allProficient = proficient_count === TOTAL_CRITERIA;
    const passed = allSubmitted && allProficient;

    let reason;
    if (passed) {
      reason = `portfolio scored Proficient on all ${TOTAL_CRITERIA} criteria`;
    } else if (!allSubmitted && submitted_deliverables.length === 0) {
      reason = 'portfolio not submitted';
    } else if (!allSubmitted) {
      reason = `portfolio incomplete: missing ${missing_deliverables.join(', ')}`;
    } else {
      reason = `rubric incomplete: ${proficient_count}/${TOTAL_CRITERIA} criteria at Proficient or above`;
    }

    return {
      applicable: true,
      passed,
      submitted_deliverables,
      missing_deliverables,
      scored_count,
      proficient_count,
      total_criteria: TOTAL_CRITERIA,
      reason,
    };
  } catch {
    // On query failure, behave as not-applicable so we degrade to completion-only
    // rather than blocking every issuance on a transient DB error.
    return base;
  }
}
