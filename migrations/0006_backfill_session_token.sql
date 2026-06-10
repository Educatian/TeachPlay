-- 0006_backfill_session_token.sql
-- Close the trust-on-first-use hole: any learners row left with a NULL
-- session_token (pre-0004 rows that never re-enrolled) could be read/written
-- with just a learner_id and no token. Give every such row a fresh 256-bit
-- random token so no legitimate row is tokenless; learnerTokenDecision then
-- treats a NULL/absent token as 'reject' instead of 'legacy'.
--
-- Legacy learners whose browser never stored this token recover the normal way
-- (re-enroll with the same email, or the emailed progress-recovery link), both
-- of which mint/return a token.
UPDATE learners
   SET session_token = lower(hex(randomblob(32)))
 WHERE session_token IS NULL OR session_token = '';
