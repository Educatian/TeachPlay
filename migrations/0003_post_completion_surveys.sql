-- Post-credential learner survey for program improvement and research-ready exports.
CREATE TABLE IF NOT EXISTS post_completion_surveys (
  id TEXT PRIMARY KEY,
  learner_id TEXT REFERENCES learners(id),
  name TEXT,
  email TEXT,
  cohort TEXT NOT NULL DEFAULT '2026-spring',
  source TEXT,
  consent_program_evaluation INTEGER NOT NULL DEFAULT 0,
  consent_deidentified_research INTEGER NOT NULL DEFAULT 0,
  followup_consent INTEGER NOT NULL DEFAULT 0,
  background_json TEXT,
  learning_outcomes_json TEXT,
  module_ratings_json TEXT,
  media_reading_json TEXT,
  artifact_evidence_json TEXT,
  transfer_json TEXT,
  open_feedback TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_post_surveys_email ON post_completion_surveys(email);
CREATE INDEX IF NOT EXISTS idx_post_surveys_learner ON post_completion_surveys(learner_id);
CREATE INDEX IF NOT EXISTS idx_post_surveys_created ON post_completion_surveys(created_at);
