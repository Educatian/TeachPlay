/**
 * /api/admin/entitlement — comp / grant / revoke a learner's paid entitlement.
 *
 * This is the money path that needs NO payment processor: a university on a
 * grant can unlock the credential path for a learner (or a whole cohort, one
 * call each) at no charge. Stripe purchases will later hit grantEntitlement()
 * through a webhook, but comping works today.
 *
 * Auth: Authorization: Bearer <ISSUER_API_KEY> (shared admin gate).
 *
 * POST body:
 *   { learner_id | email, product?='credential', tier?='paid',
 *     source?='comp', expires_at?=null, action?='grant' }
 *   action='revoke' flips status→revoked instead of granting.
 *
 * GET ?learner_id=<id>  — read current entitlement verdict for that learner.
 */
import { getClientIp, rateLimit } from '../lib/security.js';
import { checkAdminAuth } from '../lib/auth.js';
import {
  grantEntitlement, revokeEntitlement, requireProductAccess,
  DEFAULT_PRODUCT, ENTITLEMENT_SOURCES,
} from '../lib/entitlements.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function resolveLearner(env, { learner_id, email }) {
  if (learner_id) {
    return env.DB.prepare('SELECT id, name, email FROM learners WHERE id = ?').bind(String(learner_id)).first();
  }
  if (email && EMAIL_RE.test(email)) {
    return env.DB.prepare('SELECT id, name, email FROM learners WHERE email = ?').bind(String(email).toLowerCase()).first();
  }
  return null;
}

export async function handleAdminEntitlement(request, env) {
  const limit = await rateLimit(env, 'admin', getClientIp(request), 30, 60);
  if (!limit.ok) return json({ error: 'Too many requests' }, 429);

  const auth = checkAdminAuth(request, env);
  if (!auth.ok) return json(auth.body, auth.code);

  if (!env.DB) return json({ error: 'DB not configured' }, 500);

  // ── GET: read current verdict ───────────────────────────────────────────────
  if (request.method === 'GET') {
    const learner_id = new URL(request.url).searchParams.get('learner_id');
    if (!learner_id) return json({ error: 'learner_id required' }, 400);
    // Read the raw verdict regardless of the PAYWALL_ENABLED flag so an admin can
    // audit entitlements even while the paywall is still dormant.
    const verdict = await requireProductAccess({ ...env, PAYWALL_ENABLED: '1' }, learner_id, DEFAULT_PRODUCT);
    return json({ ok: true, learner_id, entitlement: verdict });
  }

  if (request.method !== 'POST') return json({ error: 'GET or POST required' }, 405);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const learner = await resolveLearner(env, { learner_id: body.learner_id, email: body.email });
  if (!learner) return json({ error: 'Learner not found (provide a valid learner_id or enrolled email)' }, 404);

  const product = body.product ? String(body.product) : DEFAULT_PRODUCT;

  if (body.action === 'revoke') {
    const r = await revokeEntitlement(env, { learner_id: learner.id, product });
    if (!r.ok) return json({ error: r.error || 'Revoke failed' }, 500);
    return json({ ok: true, action: 'revoked', learner_id: learner.id, product });
  }

  const source = body.source ? String(body.source) : 'comp';
  if (!ENTITLEMENT_SOURCES.includes(source)) {
    return json({ error: `source must be one of ${ENTITLEMENT_SOURCES.join(', ')}` }, 400);
  }
  const tier = body.tier ? String(body.tier) : 'paid';

  // Normalize expiry to canonical ISO-8601 UTC. isEntitlementActive compares
  // expires_at lexicographically against an ISO `nowIso`, which is only correct
  // for full ISO-8601 UTC strings — a date-only ("2026-12-31") or locale
  // ("12/31/2026") value would mis-verdict (e.g. wrongly lock out a paying
  // learner). Reject anything Date can't parse; store the canonical form.
  let expires_at = null;
  if (body.expires_at != null && String(body.expires_at).trim() !== '') {
    const d = new Date(String(body.expires_at));
    if (Number.isNaN(d.getTime())) {
      return json({ error: 'expires_at must be a parseable date (ISO-8601 recommended, e.g. 2026-12-31T00:00:00Z)' }, 400);
    }
    expires_at = d.toISOString();
  }

  const r = await grantEntitlement(env, {
    learner_id: learner.id, product, tier, source, expires_at,
    external_ref: body.external_ref != null ? String(body.external_ref) : null,
  });
  if (!r.ok) return json({ error: r.error || 'Grant failed' }, 500);

  return json({
    ok: true, action: 'granted',
    learner_id: learner.id, email: learner.email, product, tier, source, expires_at,
  });
}
