-- 0011_evidence_files.sql
-- Real evidence-file storage for the portfolio (LIVE state microcredential, ACHE/UA).
--
-- WHY: the React evidence editor's file dropzone was wired (by the original
-- template) to a Supabase Storage project that is dead/unreachable, so file
-- uploads always failed ("file still cannot be uploaded during the evidence
-- session"). Files now upload to THIS Worker instead (the same system of record
-- as the rest of the portfolio). A thin client shim (app/teachplay-evidence-
-- upload.js) reroutes the dropzone's upload call to POST /api/evidence-file.
--
-- STORAGE: one row per uploaded file (a learner may attach several screenshots /
-- a GDD). Bytes live in R2 when the EVIDENCE_BUCKET binding is present
-- (storage='r2', r2_key set); otherwise they are stored inline in D1
-- (storage='d1', file_b64 set) for files small enough to fit under D1's 2 MB
-- per-row limit. The endpoint feature-detects the binding, so enabling R2 later
-- is a config change, not a code change.
--
-- Additive + idempotent: CREATE TABLE / CREATE INDEX are IF NOT EXISTS so
-- re-applying is harmless. The Worker FEATURE-DETECTS this table (SELECT against
-- sqlite_master); deploying the new code BEFORE this migration is safe — uploads
-- return 503 and the dropzone reports an "intake not yet enabled" notice rather
-- than bricking, exactly like /api/evidence does for the 0008 tables.

CREATE TABLE IF NOT EXISTS evidence_files (
  id             TEXT PRIMARY KEY,             -- uuid
  learner_id     TEXT NOT NULL,                -- FK-ish to learners.id (not enforced; same as evidence_submissions)
  deliverable_id TEXT,                         -- optional D1..D5 hint; the dropzone is not deliverable-scoped
  file_name      TEXT NOT NULL,
  file_size      INTEGER,                      -- bytes, as reported by the browser File
  file_type      TEXT,                         -- MIME type
  storage        TEXT NOT NULL,                -- 'r2' | 'd1'
  r2_key         TEXT,                         -- object key when storage='r2'
  file_b64       TEXT,                          -- base64 bytes when storage='d1' (kept < D1's 2 MB row cap)
  uploaded_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_evidence_files_learner ON evidence_files(learner_id);
