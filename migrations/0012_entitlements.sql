-- 0012_entitlements.sql
-- Monetization system of record: who has paid for what.
--
-- TeachPlay's content (the 12-session handbook) stays FREE to read. The paid
-- product is the *credential path* — the evidence workspace, instructor review,
-- the signed Open Badge 3.0, and hosted AI tutoring. This table records the
-- entitlement that unlocks that path for a learner.
--
--   entitlements — one row per (learner, product). `product` lets us sell more
--                  than one thing later ('credential' today). `tier` is the
--                  plan level. `source` records HOW it was granted so a
--                  university can comp a cohort ('comp' / 'grant' / 'cohort')
--                  without a card, and Stripe purchases ('stripe') reconcile via
--                  external_ref. `expires_at` NULL = perpetual (one-time buy or
--                  comp); a timestamp = subscription period end.
--
-- SAFE / additive / idempotent: CREATE TABLE IF NOT EXISTS only. No existing
-- column, row, or table is touched. The gate code feature-detects this table
-- (src/lib/entitlements.js → entitlementsTableExists) and, when it is absent OR
-- the PAYWALL_ENABLED flag is off, defaults OPEN — i.e. applying this migration
-- alone does NOT lock out the live class. The paywall only takes effect when
-- (a) this table exists, (b) PAYWALL_ENABLED is set, and (c) the premium
-- endpoints call requireProductAccess(). Each of those is a separate, deliberate
-- step, so this migration is risk-free to deploy ahead of them.
--
-- D1 has no row-level security; access is gated entirely by the Worker
-- endpoints (learner endpoints require X-Learner-Token; admin grants require the
-- ISSUER_API_KEY via checkAdminAuth).
--
-- VERIFY after apply (remote):
--   npx wrangler d1 execute teachplay-lrs --remote --command \
--     "SELECT name FROM sqlite_master WHERE type='table' AND name='entitlements';"
--   -- expect: entitlements

CREATE TABLE IF NOT EXISTS entitlements (
  learner_id   TEXT NOT NULL REFERENCES learners(id),
  product      TEXT NOT NULL DEFAULT 'credential',      -- what was unlocked
  tier         TEXT NOT NULL DEFAULT 'paid',            -- plan level (paid | pro | …)
  source       TEXT NOT NULL,                           -- stripe | comp | grant | cohort
  status       TEXT NOT NULL DEFAULT 'active',          -- active | revoked
  external_ref TEXT,                                    -- Stripe session/subscription id (reconciliation)
  granted_at   TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at   TEXT,                                    -- NULL = perpetual; else subscription period end
  PRIMARY KEY (learner_id, product)                     -- re-grant / renewal updates in place
);

CREATE INDEX IF NOT EXISTS idx_entitlements_learner ON entitlements(learner_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_ref     ON entitlements(external_ref);
