-- Per-learner bearer token. Issued at enrolment, sent to the client, and
-- required on /api/xapi and /api/progress so a known learner_id (a UUID that
-- is handed back in plaintext) can no longer be used on its own to forge
-- telemetry or read another learner's progress.
--
-- Nullable: rows enrolled before this migration have no token. Those are
-- handled with a trust-on-first-use bind on the next authenticated call
-- (see src/lib/security.js learnerTokenDecision), so this migration is
-- backward-compatible and needs no backfill.
ALTER TABLE learners ADD COLUMN session_token TEXT;
