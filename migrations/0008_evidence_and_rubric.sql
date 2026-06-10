-- 0008_evidence_and_rubric.sql
-- Make the advertised rigor the ENFORCED rigor.
--
-- The badge advertises a 25-criterion non-compensatory rubric scored on a
-- D1-D5 portfolio (see rubrics.html / credential.html). Until now the platform
-- only enforced session click-through + quizzes; the portfolio lived in browser
-- localStorage and was never reviewed, and /api/admin/approve issued off a bare
-- learner_id with no artifact.
--
-- This migration adds the server-side system of record for that loop:
--   evidence_submissions — one row per (learner, deliverable D1..D5). The
--                          structured packet (content_json) and an optional
--                          small file (file_b64) are stored here. This is the
--                          system of record; localStorage stays as an autosave
--                          draft only.
--   rubric_scores        — one row per (learner, criterion). `level` is one of
--                          the rubric's 4 levels: Emerging | Developing |
--                          Proficient | Exemplary. PK (learner_id, criterion_id)
--                          so re-scoring a criterion updates in place.
--
-- Idempotent + additive: CREATE TABLE IF NOT EXISTS only; no existing column,
-- row, or table is touched. Deploying the new Worker code BEFORE this migration
-- is safe — every new endpoint feature-detects these tables and degrades to the
-- pre-migration (completion-only) behavior. Applying this migration then turns
-- on the full gate.
--
-- D1 has no row-level security; access is gated entirely by the Worker
-- endpoints (learner endpoints require X-Learner-Token; admin endpoints require
-- the ISSUER_API_KEY via checkAdminAuth).
--
-- VERIFY after apply (remote):
--   npx wrangler d1 execute teachplay-lrs --remote --command \
--     "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('evidence_submissions','rubric_scores');"
--   -- expect both names returned.

CREATE TABLE IF NOT EXISTS evidence_submissions (
  id            TEXT PRIMARY KEY,                       -- crypto.randomUUID()
  learner_id    TEXT NOT NULL REFERENCES learners(id),
  deliverable_id TEXT NOT NULL,                         -- D1 | D2 | D3 | D4 | D5
  content_json  TEXT,                                   -- structured packet (clamped, see api/evidence.js)
  file_name     TEXT,
  file_size     INTEGER,
  file_type     TEXT,
  file_b64      TEXT,                                   -- inline base64 only if small; else NULL + metadata above
  submitted_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One row per (learner, deliverable): resubmit updates the same row.
CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_learner_deliverable
  ON evidence_submissions(learner_id, deliverable_id);
CREATE INDEX IF NOT EXISTS idx_evidence_learner ON evidence_submissions(learner_id);

CREATE TABLE IF NOT EXISTS rubric_scores (
  learner_id   TEXT NOT NULL REFERENCES learners(id),
  criterion_id TEXT NOT NULL,                           -- e.g. d1-learner-specificity (see src/lib/rubric.js)
  level        TEXT NOT NULL,                            -- Emerging | Developing | Proficient | Exemplary
  scorer_email TEXT,
  scored_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (learner_id, criterion_id)
);
CREATE INDEX IF NOT EXISTS idx_rubric_scores_learner ON rubric_scores(learner_id);
