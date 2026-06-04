/**
 * Shared security helpers for the teachplay Worker.
 *
 *  - escapeHtml          : escape user-supplied strings before HTML interpolation
 *                          (used for outbound email bodies).
 *  - randomToken         : 256-bit cryptographically-random hex token.
 *  - getClientIp         : best-effort client IP from Cloudflare headers.
 *  - rateLimit           : KV-backed fixed-window per-IP limiter (fail-open).
 *  - learnerTokenDecision: per-learner bearer-token policy with a backward-
 *                          compatible trust-on-first-use path for rows that
 *                          predate the session_token column.
 */
import { timingSafeEqualStr } from './auth.js';

export function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

export function randomToken() {
  const a = new Uint8Array(32);
  crypto.getRandomValues(a);
  return Array.from(a, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}

export function getClientIp(request) {
  return request.headers.get('cf-connecting-ip') ||
         request.headers.get('x-forwarded-for') || '';
}

/**
 * Fixed-window per-key rate limit backed by CLAIMS_KV.
 * Returns { ok: boolean }. Fails OPEN (allows) when KV or the IP is missing,
 * so a KV hiccup never takes down enrollment/telemetry.
 *
 * windowSec must be >= 55 so the KV TTL stays above the 60 s minimum.
 */
export async function rateLimit(env, bucket, ip, limit, windowSec) {
  if (!env.CLAIMS_KV || !ip) return { ok: true };
  const win = Math.max(55, windowSec | 0);
  const slot = Math.floor(Date.now() / 1000 / win);
  const key = `rl:${bucket}:${ip}:${slot}`;
  let count = 0;
  try { count = parseInt((await env.CLAIMS_KV.get(key)) || '0', 10) || 0; } catch (_) {}
  if (count >= limit) return { ok: false };
  try { await env.CLAIMS_KV.put(key, String(count + 1), { expirationTtl: win + 5 }); } catch (_) {}
  return { ok: true };
}

/**
 * Decide how to treat a learner bearer token.
 *   storedToken  — learners.session_token for the row (may be null for legacy rows)
 *   providedToken — value of the X-Learner-Token header / body
 * Returns:
 *   'ok'     — token present and matches (constant-time)
 *   'bind'   — legacy row with no token yet; adopt the provided one (TOFU)
 *   'legacy' — legacy row, no token provided; allow (pre-token client)
 *   'reject' — token present but does not match
 */
export function learnerTokenDecision(storedToken, providedToken) {
  if (storedToken) {
    return timingSafeEqualStr(providedToken || '', storedToken) ? 'ok' : 'reject';
  }
  if (providedToken) return 'bind';
  return 'legacy';
}
