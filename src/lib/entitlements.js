/**
 * Entitlements — the paywall verdict, in one place.
 *
 * TeachPlay's handbook stays free to read. The paid product is the credential
 * path (evidence workspace, instructor review, signed badge, hosted AI). This
 * module answers one question for the premium endpoints:
 *
 *   requireProductAccess(env, learner_id, product) → { applicable, allowed, … }
 *
 * DEFAULT-OPEN by design. The gate only bites when ALL of these hold:
 *   1. the 0012 `entitlements` table exists (migration applied), AND
 *   2. env.PAYWALL_ENABLED is truthy (the operator flipped the paywall on), AND
 *   3. the endpoint actually calls requireProductAccess().
 * If any is missing, allowed=true with applicable=false — so shipping this code,
 * or applying the migration, or wiring a call site EARLY never locks out the
 * live cohort. This mirrors rubric.js's applicable=false fallback exactly.
 *
 * D1 has no row-level security; the Worker endpoints are the gate. Learner
 * access is proven by X-Learner-Token (see api/progress.js); admin grants go
 * through checkAdminAuth (ISSUER_API_KEY).
 */

export const DEFAULT_PRODUCT = 'credential';
export const ENTITLEMENT_SOURCES = ['stripe', 'comp', 'grant', 'cohort'];

/**
 * Feature-detect the 0012 table. Returns true once the migration is applied.
 * Never throws.
 */
export async function entitlementsTableExists(env) {
  if (!env || !env.DB) return false;
  try {
    const row = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM sqlite_master
       WHERE type='table' AND name='entitlements'`,
    ).first();
    return !!row && row.n >= 1;
  } catch {
    return false;
  }
}

/** Is the operator paywall switched on? Absent/empty/"0"/"false" → off. */
export function paywallEnabled(env) {
  const v = env && env.PAYWALL_ENABLED;
  if (v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s !== '' && s !== '0' && s !== 'false' && s !== 'off' && s !== 'no';
}

/**
 * Pure predicate: is this entitlement row currently valid?
 * active status AND (perpetual OR not past expiry). Exported for unit tests and
 * so callers can reason about a row they already hold.
 *
 * @param {object|null} row       entitlements row (or null if none)
 * @param {string} nowIso         ISO timestamp to compare expiry against
 */
export function isEntitlementActive(row, nowIso) {
  if (!row) return false;
  if (row.status && row.status !== 'active') return false;
  if (row.expires_at == null || row.expires_at === '') return true; // perpetual
  // Lexicographic compare is correct for ISO-8601 UTC timestamps.
  return String(row.expires_at) > String(nowIso);
}

/**
 * The gate. Resolves to:
 *   { applicable, allowed, reason, tier, source, expires_at }
 *
 *   applicable=false, allowed=true  → paywall not in force (table missing, flag
 *                                     off, or no DB). Caller proceeds as free.
 *   applicable=true,  allowed=true  → learner holds a valid entitlement.
 *   applicable=true,  allowed=false → paywall in force and learner has not paid.
 *
 * Never throws; a DB error fails OPEN (applicable=false) so a transient query
 * problem cannot brick a paying learner's access to the workspace.
 */
export async function requireProductAccess(env, learner_id, product = DEFAULT_PRODUCT, opts = {}) {
  const nowIso = opts.nowIso || new Date().toISOString();
  const open = (reason) => ({ applicable: false, allowed: true, reason, tier: null, source: null, expires_at: null });

  if (!paywallEnabled(env)) return open('paywall disabled');
  if (!(await entitlementsTableExists(env))) return open('entitlements table not enabled');
  if (!learner_id) return { applicable: true, allowed: false, reason: 'no learner', tier: null, source: null, expires_at: null };

  try {
    const row = await env.DB.prepare(
      `SELECT tier, source, status, expires_at FROM entitlements
       WHERE learner_id = ? AND product = ?`,
    ).bind(learner_id, product).first();

    const allowed = isEntitlementActive(row, nowIso);
    return {
      applicable: true,
      allowed,
      reason: allowed ? 'entitled' : (row ? 'expired or revoked' : 'no entitlement'),
      tier: row ? row.tier : null,
      source: row ? row.source : null,
      expires_at: row ? row.expires_at : null,
    };
  } catch {
    return open('entitlement lookup failed (fail-open)');
  }
}

/**
 * Grant (or renew) an entitlement. Upserts on (learner_id, product): a renewal
 * updates tier/source/expiry/status in place. Returns { ok }.
 *
 * Caller is responsible for authorization (Stripe webhook signature, or admin
 * checkAdminAuth for a comp). Never call this from an unauthenticated path.
 */
export async function grantEntitlement(env, {
  learner_id, product = DEFAULT_PRODUCT, tier = 'paid', source, external_ref = null, expires_at = null,
}) {
  if (!env || !env.DB) return { ok: false, error: 'DB not configured' };
  if (!learner_id) return { ok: false, error: 'learner_id required' };
  if (!ENTITLEMENT_SOURCES.includes(source)) return { ok: false, error: 'invalid source' };
  try {
    await env.DB.prepare(
      `INSERT INTO entitlements (learner_id, product, tier, source, status, external_ref, granted_at, expires_at)
       VALUES (?, ?, ?, ?, 'active', ?, datetime('now'), ?)
       ON CONFLICT(learner_id, product) DO UPDATE SET
         tier = excluded.tier,
         source = excluded.source,
         status = 'active',
         external_ref = excluded.external_ref,
         expires_at = excluded.expires_at`,
    ).bind(learner_id, product, tier, source, external_ref, expires_at).run();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}

/** Revoke an entitlement (subscription cancelled / refunded / admin pull). */
export async function revokeEntitlement(env, { learner_id, product = DEFAULT_PRODUCT }) {
  if (!env || !env.DB) return { ok: false, error: 'DB not configured' };
  try {
    await env.DB.prepare(
      `UPDATE entitlements SET status = 'revoked' WHERE learner_id = ? AND product = ?`,
    ).bind(learner_id, product).run();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}
