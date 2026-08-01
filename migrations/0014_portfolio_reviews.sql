-- 0014_portfolio_reviews.sql
-- Link-based portfolio review queue. AI may recommend; only an instructor can
-- final-approve, and the existing credential gate still controls issuance.
CREATE TABLE IF NOT EXISTS portfolio_reviews (
  id              TEXT PRIMARY KEY,
  learner_id      TEXT NOT NULL,
  url             TEXT NOT NULL,
  provider        TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',
  analysis_json   TEXT,
  error_message   TEXT,
  submitted_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  final_reviewed_at TEXT,
  final_reviewed_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_portfolio_reviews_learner ON portfolio_reviews(learner_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_portfolio_reviews_status ON portfolio_reviews(status, updated_at);
