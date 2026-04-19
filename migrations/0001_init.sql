-- teachplay LRS schema
-- learners: one row per enrolled learner (email is identity)
-- xapi_events: every verb emitted by the frontend

CREATE TABLE IF NOT EXISTS learners (
  id           TEXT PRIMARY KEY,                       -- crypto.randomUUID()
  email        TEXT NOT NULL UNIQUE,
  email_hash   TEXT NOT NULL UNIQUE,                   -- sha256(cohort+email)
  name         TEXT,
  cohort       TEXT NOT NULL DEFAULT '2026-spring',
  enrolled_at  TEXT NOT NULL DEFAULT (datetime('now')),
  cred_status  TEXT NOT NULL DEFAULT 'none'            -- none | pending | issued
);

CREATE TABLE IF NOT EXISTS xapi_events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  learner_id   TEXT NOT NULL REFERENCES learners(id),
  verb         TEXT NOT NULL,         -- completed, answered, scored, experienced…
  activity_id  TEXT NOT NULL,         -- e.g. session-01, quiz/s01/q2, sa/pre/LXD
  activity_type TEXT,                 -- session | quiz | self-assessment | …
  score_raw    REAL,
  score_max    REAL,
  success      INTEGER,               -- 1 = true, 0 = false, NULL = n/a
  response     TEXT,                  -- JSON blob (selected option, free text, etc.)
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_xapi_learner   ON xapi_events(learner_id);
CREATE INDEX IF NOT EXISTS idx_xapi_activity  ON xapi_events(activity_id);
CREATE INDEX IF NOT EXISTS idx_xapi_verb      ON xapi_events(verb);
CREATE INDEX IF NOT EXISTS idx_xapi_created   ON xapi_events(created_at);
