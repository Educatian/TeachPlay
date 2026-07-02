// Unit coverage for the comp/grant/revoke admin endpoint (the money path that
// needs no Stripe). Mocks request + D1; asserts the auth gate, validation, and
// the grant/revoke/read outcomes. Delegated DB writes are covered separately in
// entitlements.test.mjs; here we prove the HTTP contract around them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleAdminEntitlement } from '../../src/api/admin-entitlement.js';

const LEARNER = { id: 'L1', name: 'QA', email: 'qa@example.com' };

function mockReq({ method = 'POST', auth = 'Bearer right', body = {}, url = 'https://teachplay.dev/api/admin/entitlement' } = {}) {
  return {
    method,
    url,
    headers: { get: (k) => (k.toLowerCase() === 'authorization' ? auth : null) },
    async json() { return body; },
  };
}

// Mock D1 routed by SQL. runLog captures writes.
function mockEnv({ learner = LEARNER, entRow = null, tableExists = true } = {}) {
  const runLog = [];
  const DB = {
    prepare(sql) {
      const bound = (args) => ({
        async first() {
          if (/FROM learners/.test(sql)) return learner;
          if (/sqlite_master/.test(sql)) return { n: tableExists ? 1 : 0 };
          if (/FROM entitlements/.test(sql)) return entRow;
          return null;
        },
        async run() { runLog.push({ sql, args }); return { meta: { changes: 1 } }; },
      });
      return { bind: (...args) => bound(args), first: bound([]).first };
    },
  };
  return { env: { ISSUER_API_KEY: 'right', PAYWALL_ENABLED: '1', DB }, runLog };
}

test('rejects a non-GET/POST method with 405', async () => {
  const { env } = mockEnv();
  const res = await handleAdminEntitlement(mockReq({ method: 'DELETE' }), env);
  assert.equal(res.status, 405);
});

test('rejects a wrong admin key with 401', async () => {
  const { env } = mockEnv();
  const res = await handleAdminEntitlement(mockReq({ auth: 'Bearer wrong' }), env);
  assert.equal(res.status, 401);
});

test('404 when the learner cannot be resolved', async () => {
  const { env } = mockEnv({ learner: null });
  const res = await handleAdminEntitlement(mockReq({ body: { email: 'nobody@example.com' } }), env);
  assert.equal(res.status, 404);
});

test('grants a comp entitlement by email (happy path)', async () => {
  const { env, runLog } = mockEnv();
  const res = await handleAdminEntitlement(mockReq({ body: { email: 'qa@example.com' } }), env);
  assert.equal(res.status, 200);
  const out = JSON.parse(await res.text());
  assert.equal(out.ok, true);
  assert.equal(out.action, 'granted');
  assert.equal(out.source, 'comp');       // default source
  assert.equal(out.tier, 'paid');         // default tier
  assert.equal(runLog.length, 1);
  assert.match(runLog[0].sql, /INSERT INTO entitlements/);
});

test('rejects an invalid source with 400', async () => {
  const { env } = mockEnv();
  const res = await handleAdminEntitlement(mockReq({ body: { learner_id: 'L1', source: 'bogus' } }), env);
  assert.equal(res.status, 400);
});

test('revoke action flips status and reports revoked', async () => {
  const { env, runLog } = mockEnv();
  const res = await handleAdminEntitlement(mockReq({ body: { learner_id: 'L1', action: 'revoke' } }), env);
  assert.equal(res.status, 200);
  const out = JSON.parse(await res.text());
  assert.equal(out.action, 'revoked');
  assert.match(runLog[0].sql, /UPDATE entitlements SET status = 'revoked'/);
});

test('GET reads the entitlement verdict for a learner', async () => {
  const { env } = mockEnv({ entRow: { tier: 'paid', source: 'comp', status: 'active', expires_at: null } });
  const res = await handleAdminEntitlement(
    mockReq({ method: 'GET', body: {}, url: 'https://teachplay.dev/api/admin/entitlement?learner_id=L1' }), env);
  assert.equal(res.status, 200);
  const out = JSON.parse(await res.text());
  assert.equal(out.ok, true);
  assert.equal(out.entitlement.allowed, true);
  assert.equal(out.entitlement.tier, 'paid');
});
