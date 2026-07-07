-- 0013_provenance_log.sql
-- GenAI Provenance Log — the tooling for the practice the program already teaches.
--
-- WHY: the handbook and the AI Use Policy require learners to document their
-- GenAI prompts, outputs, and revisions (the evidence packet's GenAI Design
-- section asks for it in prose), but the platform had no structured tool for
-- it. This table is the system of record for per-deliverable provenance
-- entries, each carrying a declared AI Assessment Scale level (Perkins,
-- Furze, Roe & MacVaugh, 2024, doi 10.53761/q3azde36 — five declared levels
-- of AI use: 1 No AI · 2 AI Planning · 3 AI Collaboration · 4 Full AI ·
-- 5 AI Exploration). The log is advisory context for the instructor's rubric
-- review (assess the process, not police it — Dawson et al., 2024); it does
-- NOT feed the credential gate.
--
-- Text fields are size-clamped in the API (src/api/provenance.js), not in the
-- schema — same policy as evidence_submissions.content_json (see 0008 +
-- api/evidence.js).
--
-- Additive + idempotent: CREATE TABLE / CREATE INDEX are IF NOT EXISTS so
-- re-applying is harmless. The Worker FEATURE-DETECTS this table (SELECT
-- against sqlite_master); deploying the new code BEFORE this migration is
-- safe — POST /api/provenance returns 503 and the client falls back to a
-- localStorage draft, exactly like /api/evidence does for the 0008 tables.
--
-- VERIFY after apply (remote):
--   npx wrangler d1 execute teachplay-lrs --remote --command \
--     "SELECT name FROM sqlite_master WHERE type='table' AND name='provenance_entries';"

CREATE TABLE IF NOT EXISTS provenance_entries (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  learner_id     TEXT NOT NULL,                        -- FK-ish to learners.id (not enforced; same as evidence_submissions)
  deliverable_id TEXT NOT NULL,                        -- D1 | D2 | D3 | D4 | D5
  seq            INTEGER,                              -- 1-based order within (learner, deliverable); assigned by the API
  tool_name      TEXT,                                 -- e.g. "Claude", "Midjourney" (clamped, see api/provenance.js)
  prompt_text    TEXT,                                 -- the prompt as sent (clamped)
  output_excerpt TEXT,                                 -- salient excerpt of the tool's output (clamped)
  revision_note  TEXT,                                 -- what the learner changed/kept and why (clamped)
  aias_level     INTEGER CHECK (aias_level BETWEEN 1 AND 5),  -- declared AI Assessment Scale level
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_provenance_learner ON provenance_entries(learner_id);
CREATE INDEX IF NOT EXISTS idx_provenance_learner_deliverable
  ON provenance_entries(learner_id, deliverable_id);
