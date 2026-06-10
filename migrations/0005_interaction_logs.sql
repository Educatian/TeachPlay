-- 0005_interaction_logs.sql
-- Full-content research logs that the lightweight xapi_events table does not keep:
--   ai_conversations  — every AI touchpoint / evaluator exchange, prompt + response text
--   gameplay_events   — every minigame interaction and lab launch, with full detail
-- Both are scoped to an enrolled learner (FK) and written through /api/log/*,
-- which is gated by the same per-learner session token as /api/xapi.

CREATE TABLE IF NOT EXISTS ai_conversations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  learner_id    TEXT NOT NULL REFERENCES learners(id),
  source        TEXT NOT NULL,          -- 'touchpoint' | 'defense-evaluator' | …
  session_id    TEXT,                   -- s01..s12 context, if any
  lo_id         TEXT,                   -- learning-outcome id the interaction targets
  model         TEXT,
  system_prompt TEXT,
  user_prompt   TEXT NOT NULL,
  response      TEXT,
  ok            INTEGER,                -- 1 = model replied, 0 = error
  error         TEXT,
  duration_ms   INTEGER,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_aiconv_learner ON ai_conversations(learner_id);
CREATE INDEX IF NOT EXISTS idx_aiconv_session ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_aiconv_created ON ai_conversations(created_at);

CREATE TABLE IF NOT EXISTS gameplay_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  learner_id  TEXT NOT NULL REFERENCES learners(id),
  game        TEXT NOT NULL,            -- 's02' | 'orbit-sum-lab' | 'electric-circuit-lab' | …
  session_id  TEXT,                     -- s01..s12 context, if any
  event       TEXT NOT NULL,            -- 'start' | 'answer' | 'score' | 'launch' | …
  detail      TEXT,                     -- JSON blob: full event payload
  correct     INTEGER,                  -- 1 = correct, 0 = wrong, NULL = n/a
  score_raw   REAL,
  score_max   REAL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_gameplay_learner ON gameplay_events(learner_id);
CREATE INDEX IF NOT EXISTS idx_gameplay_game    ON gameplay_events(game);
CREATE INDEX IF NOT EXISTS idx_gameplay_created ON gameplay_events(created_at);
