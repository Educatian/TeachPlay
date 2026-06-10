-- 0009_rubric_raters.sql
-- Multi-rater rubric scoring → enables inter-rater reliability (IRR).
--
-- migration 0008 stores rubric_scores with PK (learner_id, criterion_id): that
-- is the AUTHORITATIVE "latest score per criterion" that rubricPassed() reads,
-- and it is intentionally SINGLE-rater (a re-score replaces in place). It cannot
-- represent two instructors independently scoring the same portfolio, so it
-- cannot support an IRR study (Cohen's/Fleiss' κ, Gwet's AC1).
--
-- This migration adds a SECOND, append-style table that keeps one row per
-- (learner, criterion, scorer). /api/admin/score writes BOTH:
--   * rubric_scores            — unchanged authoritative latest-per-criterion
--                                (rubricPassed / the issuance gate still read
--                                 ONLY this; their semantics are untouched), and
--   * rubric_scores_raters     — one row per rater, so the same portfolio scored
--                                by two instructors yields two rows per criterion
--                                that the psychometrics endpoint can compare.
--
-- Idempotent + additive: CREATE TABLE IF NOT EXISTS only. No existing column,
-- row, or table is touched, and rubric_scores is NOT modified. The score
-- endpoint and the psychometrics endpoint both feature-detect this table: if it
-- is absent (pre-migration), scoring still works against rubric_scores alone and
-- IRR reports {status:'insufficient'} instead of erroring.
--
-- VERIFY after apply (remote):
--   npx wrangler d1 execute teachplay-lrs --remote --command \
--     "SELECT name FROM sqlite_master WHERE type='table' AND name='rubric_scores_raters';"
--   -- expect the name returned.

CREATE TABLE IF NOT EXISTS rubric_scores_raters (
  learner_id   TEXT NOT NULL REFERENCES learners(id),
  criterion_id TEXT NOT NULL,                  -- e.g. d1-learner-specificity (src/lib/rubric.js)
  scorer_email TEXT NOT NULL,                  -- the rater identity (X-Scorer-Email); '' → 'anonymous'
  level        TEXT NOT NULL,                  -- Emerging | Developing | Proficient | Exemplary
  scored_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (learner_id, criterion_id, scorer_email)
);
CREATE INDEX IF NOT EXISTS idx_rubric_raters_learner    ON rubric_scores_raters(learner_id);
CREATE INDEX IF NOT EXISTS idx_rubric_raters_criterion  ON rubric_scores_raters(criterion_id);
CREATE INDEX IF NOT EXISTS idx_rubric_raters_scorer     ON rubric_scores_raters(scorer_email);
