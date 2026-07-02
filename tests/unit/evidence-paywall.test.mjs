// Unit coverage for the paywall choke point wired into /api/evidence.
// Proves the freemium contract: with the paywall OFF submission proceeds
// exactly as before (default-open), and with the paywall ON an unpaid learner
// is turned away with 402 BEFORE any evidence is stored.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleEvidence } from '../../src/api/evidence.js';

const LEARNER = { id: 'L1', session_token: 'tok' };

function mockReq({ token = 'tok', body = { learner_id: 'L1', deliverables: [{ deliverable_id: 'D1', content: { x: 1 } }] } } = {}) {
  return {
    method: 'POST',
    headers: { get: (k) => (k.toLowerCase() === 'x-learner-token' ? token : null) },
    async json() { return body; },
  };
}

// Routed mock D1. entTable/entRow/evTable control the two feature-detects and
// the entitlement lookup. batchLog records writes.
function mockEnv({ PAYWALL_ENABLED = '0', entTable = true, entRow = null, evTable = true } = {}) {
  const batchLog = [];
  const DB = {
    prepare(sql) {
      const bound = () => ({
        async first() {
          if (/FROM learners/.test(sql)) return LEARNER;
          if (/sqlite_master/.test(sql) && /entitlements/.test(sql)) return { n: entTable ? 1 : 0 };
          if (/FROM entitlements/.test(sql)) return entRow;
          if (/sqlite_master/.test(sql) && /evidence_submissions/.test(sql)) return evTable ? { ok: 1 } : null;
          return null;
        },
        async run() { return { meta: { changes: 1 } }; },
      });
      return { bind: () => bound(), first: bound().first };
    },
    async batch(stmts) { batchLog.push(stmts.length); return stmts.map(() => ({ meta: { changes: 1 } })); },
  };
  return { env: { PAYWALL_ENABLED, DB }, batchLog };
}

test('paywall OFF → submission proceeds (default-open, stores D1)', async () => {
  const { env, batchLog } = mockEnv({ PAYWALL_ENABLED: '0' });
  const res = await handleEvidence(mockReq(), env);
  assert.equal(res.status, 200);
  const out = JSON.parse(await res.text());
  assert.deepEqual(out.stored, ['D1']);
  assert.equal(batchLog.length, 1);           // it actually wrote
});

test('paywall ON + no entitlement → 402 BEFORE storing anything', async () => {
  const { env, batchLog } = mockEnv({ PAYWALL_ENABLED: '1', entRow: null });
  const res = await handleEvidence(mockReq(), env);
  assert.equal(res.status, 402);
  const out = JSON.parse(await res.text());
  assert.equal(out.code, 'payment_required');
  assert.equal(batchLog.length, 0);           // nothing was written
});

test('paywall ON + active entitlement → submission proceeds', async () => {
  const { env, batchLog } = mockEnv({
    PAYWALL_ENABLED: '1',
    entRow: { tier: 'paid', source: 'stripe', status: 'active', expires_at: null },
  });
  const res = await handleEvidence(mockReq(), env);
  assert.equal(res.status, 200);
  assert.equal(batchLog.length, 1);
});

test('paywall ON but entitlements table absent → default-open (never lock the class)', async () => {
  const { env } = mockEnv({ PAYWALL_ENABLED: '1', entTable: false });
  const res = await handleEvidence(mockReq(), env);
  assert.equal(res.status, 200);              // applicable=false → proceeds
});

test('bad token still rejected before the paywall is consulted', async () => {
  const { env } = mockEnv({ PAYWALL_ENABLED: '1' });
  const res = await handleEvidence(mockReq({ token: 'wrong' }), env);
  assert.equal(res.status, 403);
});
