// Unit coverage for the GenAI Provenance Log endpoints (T2).
//
// Proves the contract: POST /api/provenance is learner-token-gated exactly
// like /api/evidence, clamps oversized text server-side, rejects invalid AIAS
// levels, and degrades to 503 pre-migration (client falls back to a
// localStorage draft); GET returns only the caller's own entries; the admin
// view is checkAdminAuth-gated and groups entries by deliverable.
// Mock D1 follows tests/unit/evidence-paywall.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleProvenance, handleAdminProvenance } from '../../src/api/provenance.js';

const LEARNER = { id: 'L1', session_token: 'tok' };
const ADMIN_KEY = 'admin-key';

const VALID_BODY = {
  deliverable_id: 'D2',
  tool_name: 'Claude',
  prompt_text: 'Act as a curriculum designer…',
  output_excerpt: 'Here are three candidate mechanics…',
  revision_note: 'Kept mechanic 2, rejected 1 and 3 (violates D1 constraint).',
  aias_level: 3,
};

function req({ method = 'POST', headers = {}, body = null, url = 'https://teachplay.dev/api/provenance' } = {}) {
  const h = {};
  for (const [k, v] of Object.entries(headers)) h[k.toLowerCase()] = v;
  return {
    method,
    url,
    headers: { get: (k) => (k.toLowerCase() in h ? h[k.toLowerCase()] : null) },
    async json() { return body; },
  };
}

const learnerHeaders = { 'X-Learner-ID': 'L1', 'X-Learner-Token': 'tok' };

// Routed mock D1. provTable controls the feature-detect; `rows` feeds SELECTs;
// `writes` records every INSERT's bind args so clamping is observable.
function mockEnv({ provTable = true, learner = LEARNER, rows = [] } = {}) {
  const writes = [];
  const DB = {
    prepare(sql) {
      // tableExists() calls .first() with no .bind() (no placeholders), so the
      // statement methods must exist both on prepare() and on bind() — same
      // shape as the evidence-paywall mock.
      const stmt = (args = []) => ({
        async first() {
          if (/FROM learners/.test(sql)) return learner;
          if (/sqlite_master/.test(sql)) return provTable ? { ok: 1 } : null;
          return null;
        },
        async run() {
          if (/INSERT INTO provenance_entries/.test(sql)) writes.push(args);
          return { meta: { changes: 1, last_row_id: 42 } };
        },
        async all() { return { results: rows }; },
      });
      return { bind: (...args) => stmt(args), ...stmt([]) };
    },
  };
  return { env: { DB, ISSUER_API_KEY: ADMIN_KEY }, writes };
}

async function body(res) { return JSON.parse(await res.text()); }

// ── POST: auth gating (same policy as /api/evidence) ────────────────────────

test('POST provenance: valid token → 201-shaped 200, entry written', async () => {
  const { env, writes } = mockEnv();
  const res = await handleProvenance(req({ headers: learnerHeaders, body: VALID_BODY }), env);
  assert.equal(res.status, 200);
  const out = await body(res);
  assert.equal(out.ok, true);
  assert.equal(out.stored, 'D2');
  assert.equal(out.aias_level, 3);
  assert.equal(writes.length, 1);
  // bind order: learner_id, deliverable_id, learner_id, deliverable_id (seq subquery), then fields
  assert.equal(writes[0][0], 'L1');
  assert.equal(writes[0][1], 'D2');
  assert.equal(writes[0][8], 3);
});

test('POST provenance: wrong token → 403, nothing written', async () => {
  const { env, writes } = mockEnv();
  const res = await handleProvenance(
    req({ headers: { 'X-Learner-ID': 'L1', 'X-Learner-Token': 'wrong' }, body: VALID_BODY }), env);
  assert.equal(res.status, 403);
  assert.equal(writes.length, 0);
});

test('POST provenance: missing learner id → 401', async () => {
  const { env } = mockEnv();
  const res = await handleProvenance(req({ body: VALID_BODY }), env);
  assert.equal(res.status, 401);
});

test('POST provenance: unknown learner → 403', async () => {
  const { env } = mockEnv({ learner: null });
  const res = await handleProvenance(req({ headers: learnerHeaders, body: VALID_BODY }), env);
  assert.equal(res.status, 403);
});

// ── POST: validation ─────────────────────────────────────────────────────────

test('POST provenance: aias_level out of range / non-integer → 400', async () => {
  for (const bad of [0, 6, 2.5, 'high', null, undefined]) {
    const { env, writes } = mockEnv();
    const res = await handleProvenance(
      req({ headers: learnerHeaders, body: { ...VALID_BODY, aias_level: bad } }), env);
    assert.equal(res.status, 400, `aias_level=${bad} must be rejected`);
    assert.equal(writes.length, 0);
  }
});

test('POST provenance: invalid deliverable_id → 400', async () => {
  const { env, writes } = mockEnv();
  const res = await handleProvenance(
    req({ headers: learnerHeaders, body: { ...VALID_BODY, deliverable_id: 'D9' } }), env);
  assert.equal(res.status, 400);
  assert.equal(writes.length, 0);
});

test('POST provenance: level >1 with no provenance content → 400; level 1 bare → ok', async () => {
  const bare = { deliverable_id: 'D1', aias_level: 3 };
  const { env: e1, writes: w1 } = mockEnv();
  const res1 = await handleProvenance(req({ headers: learnerHeaders, body: bare }), e1);
  assert.equal(res1.status, 400);
  assert.equal(w1.length, 0);

  const { env: e2, writes: w2 } = mockEnv();
  const res2 = await handleProvenance(
    req({ headers: learnerHeaders, body: { deliverable_id: 'D1', aias_level: 1 } }), e2);
  assert.equal(res2.status, 200);          // "No AI" legitimately has nothing to transcribe
  assert.equal(w2.length, 1);
});

test('POST provenance: oversized text fields are clamped server-side', async () => {
  const { env, writes } = mockEnv();
  const res = await handleProvenance(req({
    headers: learnerHeaders,
    body: {
      ...VALID_BODY,
      tool_name: 'x'.repeat(1000),
      prompt_text: 'p'.repeat(64 * 1024),
      output_excerpt: 'o'.repeat(64 * 1024),
      revision_note: 'r'.repeat(64 * 1024),
    },
  }), env);
  assert.equal(res.status, 200);
  const [, , , , tool, prompt, output, revision] = writes[0];
  assert.equal(tool.length, 128);
  assert.equal(prompt.length, 16 * 1024);
  assert.equal(output.length, 8 * 1024);
  assert.equal(revision.length, 4 * 1024);
});

// ── POST: feature-detect (pre-migration 0013) ───────────────────────────────

test('POST provenance: table absent → 503 so the client falls back to localStorage', async () => {
  const { env, writes } = mockEnv({ provTable: false });
  const res = await handleProvenance(req({ headers: learnerHeaders, body: VALID_BODY }), env);
  assert.equal(res.status, 503);
  const out = await body(res);
  assert.match(out.error, /not yet enabled/);
  assert.equal(writes.length, 0);
});

// ── GET: learner's own entries ───────────────────────────────────────────────

test('GET provenance: token-gated, returns own entries', async () => {
  const rows = [
    { id: 1, deliverable_id: 'D1', seq: 1, tool_name: 'Claude', aias_level: 3, created_at: '2026-07-01 10:00:00' },
  ];
  const { env } = mockEnv({ rows });
  const res = await handleProvenance(req({ method: 'GET', headers: learnerHeaders }), env);
  assert.equal(res.status, 200);
  const out = await body(res);
  assert.equal(out.enabled, true);
  assert.equal(out.entries.length, 1);

  const bad = await handleProvenance(
    req({ method: 'GET', headers: { 'X-Learner-ID': 'L1', 'X-Learner-Token': 'wrong' } }), env);
  assert.equal(bad.status, 403);
});

test('GET provenance: table absent → graceful enabled:false, empty list', async () => {
  const { env } = mockEnv({ provTable: false });
  const res = await handleProvenance(req({ method: 'GET', headers: learnerHeaders }), env);
  assert.equal(res.status, 200);
  const out = await body(res);
  assert.equal(out.enabled, false);
  assert.deepEqual(out.entries, []);
});

// ── Admin: checkAdminAuth-gated, grouped by deliverable ─────────────────────

const adminUrl = 'https://teachplay.dev/api/admin/provenance?learner_id=L1';

test('admin provenance: no/wrong key → 401', async () => {
  const { env } = mockEnv();
  const noKey = await handleAdminProvenance(req({ method: 'GET', url: adminUrl }), env);
  assert.equal(noKey.status, 401);
  const wrongKey = await handleAdminProvenance(
    req({ method: 'GET', url: adminUrl, headers: { Authorization: 'Bearer nope' } }), env);
  assert.equal(wrongKey.status, 401);
});

test('admin provenance: valid key → entries grouped by deliverable', async () => {
  const rows = [
    { id: 1, deliverable_id: 'D1', seq: 1, aias_level: 2, created_at: '2026-07-01 10:00:00' },
    { id: 2, deliverable_id: 'D1', seq: 2, aias_level: 3, created_at: '2026-07-01 11:00:00' },
    { id: 3, deliverable_id: 'D3', seq: 1, aias_level: 4, created_at: '2026-07-02 09:00:00' },
  ];
  const { env } = mockEnv({ rows });
  const res = await handleAdminProvenance(
    req({ method: 'GET', url: adminUrl, headers: { Authorization: 'Bearer ' + ADMIN_KEY } }), env);
  assert.equal(res.status, 200);
  const out = await body(res);
  assert.equal(out.total, 3);
  assert.equal(out.by_deliverable.D1.length, 2);
  assert.equal(out.by_deliverable.D3.length, 1);
  assert.equal(out.by_deliverable.D2, undefined);
});

test('admin provenance: learner_id required → 400; table absent → enabled:false', async () => {
  const auth = { Authorization: 'Bearer ' + ADMIN_KEY };
  const { env } = mockEnv();
  const noId = await handleAdminProvenance(
    req({ method: 'GET', url: 'https://teachplay.dev/api/admin/provenance', headers: auth }), env);
  assert.equal(noId.status, 400);

  const { env: envOff } = mockEnv({ provTable: false });
  const off = await handleAdminProvenance(req({ method: 'GET', url: adminUrl, headers: auth }), envOff);
  assert.equal(off.status, 200);
  const out = await body(off);
  assert.equal(out.enabled, false);
  assert.equal(out.total, 0);
});

test('provenance: non-POST/GET method → 405', async () => {
  const { env } = mockEnv();
  const res = await handleProvenance(req({ method: 'DELETE', headers: learnerHeaders }), env);
  assert.equal(res.status, 405);
  const adm = await handleAdminProvenance(
    req({ method: 'POST', url: adminUrl, headers: { Authorization: 'Bearer ' + ADMIN_KEY } }), env);
  assert.equal(adm.status, 405);
});
