// Unit coverage for the paywall verdict logic (src/lib/entitlements.js).
// No Worker runtime, no Playwright — a tiny mock D1 exercises the pure and
// async gate logic. The invariant under test: the gate DEFAULTS OPEN and only
// bites when the table exists AND the flag is on AND a valid row is absent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isEntitlementActive, paywallEnabled, requireProductAccess,
  grantEntitlement, entitlementsTableExists,
} from '../../src/lib/entitlements.js';

const NOW = '2026-07-01T00:00:00.000Z';

// ── mock D1 ──────────────────────────────────────────────────────────────────
// opts: { tableExists:boolean, row:object|null, throwOn:'exists'|'lookup'|null }
function mockEnv(opts = {}) {
  const { tableExists = true, row = null, throwOn = null, PAYWALL_ENABLED = '1' } = opts;
  const runLog = [];
  const DB = {
    prepare(sql) {
      const isExists = /sqlite_master/.test(sql);
      const bound = (args) => ({
        async first() {
          if (isExists && throwOn === 'exists') throw new Error('boom');
          if (!isExists && throwOn === 'lookup') throw new Error('boom');
          if (isExists) return { n: tableExists ? 1 : 0 };
          return row;
        },
        async run() { runLog.push({ sql, args }); return { meta: { changes: 1 } }; },
      });
      return {
        bind: (...args) => bound(args),
        // table-exists check calls .first() without .bind()
        first: bound([]).first,
      };
    },
  };
  return { env: { DB, PAYWALL_ENABLED }, runLog };
}

// ── isEntitlementActive (pure) ───────────────────────────────────────────────
test('isEntitlementActive: null row → false', () => {
  assert.equal(isEntitlementActive(null, NOW), false);
});
test('isEntitlementActive: active + perpetual (null expiry) → true', () => {
  assert.equal(isEntitlementActive({ status: 'active', expires_at: null }, NOW), true);
});
test('isEntitlementActive: active + empty-string expiry → true (perpetual)', () => {
  assert.equal(isEntitlementActive({ status: 'active', expires_at: '' }, NOW), true);
});
test('isEntitlementActive: active + future expiry → true', () => {
  assert.equal(isEntitlementActive({ status: 'active', expires_at: '2026-12-31T00:00:00.000Z' }, NOW), true);
});
test('isEntitlementActive: active + past expiry → false', () => {
  assert.equal(isEntitlementActive({ status: 'active', expires_at: '2026-01-01T00:00:00.000Z' }, NOW), false);
});
test('isEntitlementActive: revoked → false even if unexpired', () => {
  assert.equal(isEntitlementActive({ status: 'revoked', expires_at: null }, NOW), false);
});

// ── paywallEnabled ───────────────────────────────────────────────────────────
test('paywallEnabled: unset/empty/0/false/off/no → off', () => {
  for (const v of [undefined, null, '', '0', 'false', 'FALSE', 'off', 'No']) {
    assert.equal(paywallEnabled({ PAYWALL_ENABLED: v }), false, `value=${v}`);
  }
});
test('paywallEnabled: 1/true/on → on', () => {
  for (const v of ['1', 'true', 'on', 'yes']) {
    assert.equal(paywallEnabled({ PAYWALL_ENABLED: v }), true, `value=${v}`);
  }
});

// ── entitlementsTableExists ──────────────────────────────────────────────────
test('entitlementsTableExists: true when present, false when absent, false on throw', async () => {
  assert.equal(await entitlementsTableExists(mockEnv({ tableExists: true }).env), true);
  assert.equal(await entitlementsTableExists(mockEnv({ tableExists: false }).env), false);
  assert.equal(await entitlementsTableExists(mockEnv({ throwOn: 'exists' }).env), false);
  assert.equal(await entitlementsTableExists({}), false);
});

// ── requireProductAccess (the gate) ──────────────────────────────────────────
test('gate: paywall OFF → open (applicable=false, allowed=true)', async () => {
  const { env } = mockEnv({ PAYWALL_ENABLED: '0' });
  const v = await requireProductAccess(env, 'L1', 'credential', { nowIso: NOW });
  assert.equal(v.applicable, false);
  assert.equal(v.allowed, true);
});
test('gate: paywall ON but table MISSING → open (never lock out a live class)', async () => {
  const { env } = mockEnv({ tableExists: false });
  const v = await requireProductAccess(env, 'L1', 'credential', { nowIso: NOW });
  assert.equal(v.applicable, false);
  assert.equal(v.allowed, true);
});
test('gate: ON + table present + NO row → denied', async () => {
  const { env } = mockEnv({ row: null });
  const v = await requireProductAccess(env, 'L1', 'credential', { nowIso: NOW });
  assert.equal(v.applicable, true);
  assert.equal(v.allowed, false);
  assert.equal(v.reason, 'no entitlement');
});
test('gate: ON + active perpetual row → allowed', async () => {
  const { env } = mockEnv({ row: { tier: 'paid', source: 'stripe', status: 'active', expires_at: null } });
  const v = await requireProductAccess(env, 'L1', 'credential', { nowIso: NOW });
  assert.equal(v.allowed, true);
  assert.equal(v.tier, 'paid');
});
test('gate: ON + expired row → denied', async () => {
  const { env } = mockEnv({ row: { tier: 'paid', source: 'stripe', status: 'active', expires_at: '2026-01-01T00:00:00.000Z' } });
  const v = await requireProductAccess(env, 'L1', 'credential', { nowIso: NOW });
  assert.equal(v.allowed, false);
  assert.equal(v.reason, 'expired or revoked');
});
test('gate: ON + no learner_id → denied (not open)', async () => {
  const { env } = mockEnv({});
  const v = await requireProductAccess(env, '', 'credential', { nowIso: NOW });
  assert.equal(v.applicable, true);
  assert.equal(v.allowed, false);
});
test('gate: DB lookup throws → fail OPEN', async () => {
  const { env } = mockEnv({ throwOn: 'lookup' });
  const v = await requireProductAccess(env, 'L1', 'credential', { nowIso: NOW });
  assert.equal(v.allowed, true);
  assert.equal(v.applicable, false);
});

// ── grantEntitlement ─────────────────────────────────────────────────────────
test('grant: invalid source rejected', async () => {
  const { env } = mockEnv({});
  const r = await grantEntitlement(env, { learner_id: 'L1', source: 'bogus' });
  assert.equal(r.ok, false);
});
test('grant: valid comp writes a row', async () => {
  const { env, runLog } = mockEnv({});
  const r = await grantEntitlement(env, { learner_id: 'L1', source: 'comp' });
  assert.equal(r.ok, true);
  assert.equal(runLog.length, 1);
  assert.match(runLog[0].sql, /INSERT INTO entitlements/);
});
test('grant: missing learner_id rejected', async () => {
  const { env } = mockEnv({});
  const r = await grantEntitlement(env, { source: 'comp' });
  assert.equal(r.ok, false);
});
