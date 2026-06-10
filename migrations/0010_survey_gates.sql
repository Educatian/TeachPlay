-- 0010_survey_gates.sql
-- Survey-gated credentialing (LIVE state microcredential, ACHE/UA).
--
-- GATE POLICY = completion/submission, NOT consent-yes. Submitting the Qualtrics
-- form passes the gate; the research-data-use questions inside the form are
-- OPT-IN and never block the credential or screen anyone out.
--
-- Two touchpoints recorded on the learner row:
--   consent_completed_at / consent_response_id — set when the PRE consent survey
--     is submitted (gates program START — the learner can't begin the sessions).
--   survey_completed_at  / survey_response_id  — set when the POST completion
--     survey is submitted (gates the certificate CLAIM).
--
-- Additive + idempotent: ALTER TABLE ADD COLUMN guarded by a per-column existence
-- check is NOT expressible in plain SQLite DDL, so each ADD COLUMN is run
-- standalone; SQLite errors "duplicate column name" if re-applied, which is
-- harmless (the column already exists). The Worker FEATURE-DETECTS these columns
-- via PRAGMA table_info(learners) — deploying the new code BEFORE this migration
-- is safe: the survey gate stays INACTIVE (current behavior) until BOTH these
-- columns exist AND the QUALTRICS_* Worker secrets are set, so the live class is
-- never locked out by a deploy alone.
--
-- D1 has no row-level security; access is gated by the Worker endpoints
-- (learner endpoints require X-Learner-Token; return endpoints verify an HMAC
-- sig; admin endpoints require ISSUER_API_KEY).
--
-- VERIFY after apply (remote):
--   npx wrangler d1 execute teachplay-lrs --remote --command \
--     "PRAGMA table_info(learners);"
--   -- expect consent_completed_at, consent_response_id, survey_completed_at,
--   --        survey_response_id among the columns.

ALTER TABLE learners ADD COLUMN consent_completed_at TEXT;
ALTER TABLE learners ADD COLUMN consent_response_id  TEXT;
ALTER TABLE learners ADD COLUMN survey_completed_at  TEXT;
ALTER TABLE learners ADD COLUMN survey_response_id   TEXT;
