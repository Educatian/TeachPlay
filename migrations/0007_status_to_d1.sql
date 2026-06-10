-- 0007_status_to_d1.sql
-- Move credential status from Workers KV (which has no compare-and-swap) to D1,
-- where every statement is atomic. This closes two races the KV path had:
--   * allocateIndex (get→put) could hand the SAME revocation index to two
--     concurrent issuances, conflating two learners onto one bit.
--   * revoke (readBits→setBit→writeBits) could lose a concurrent bit flip.
--
-- New model:
--   status_alloc        — one atomic counter per cohort (INSERT … ON CONFLICT
--                         DO UPDATE … RETURNING gives each caller a unique index)
--   status_revocations  — one row per revoked (cohort, idx). Revoke = INSERT OR
--                         IGNORE, reinstate = DELETE; both idempotent + atomic.
--   status_index_map    — audit trail of which credential/learner got which idx.
-- The signed BitstringStatusList is rebuilt from status_revocations on read.

CREATE TABLE IF NOT EXISTS status_alloc (
  cohort     TEXT PRIMARY KEY,
  next_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS status_revocations (
  cohort        TEXT NOT NULL,
  idx           INTEGER NOT NULL,
  learner_id    TEXT,
  credential_id TEXT,
  revoked_at    TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (cohort, idx)
);
CREATE INDEX IF NOT EXISTS idx_status_revocations_cohort ON status_revocations(cohort);

CREATE TABLE IF NOT EXISTS status_index_map (
  cohort        TEXT NOT NULL,
  idx           INTEGER NOT NULL,
  credential_id TEXT,
  learner_id    TEXT,
  allocated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (cohort, idx)
);
