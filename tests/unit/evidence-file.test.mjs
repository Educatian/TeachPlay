// Unit coverage for /api/evidence-file: auth gate, feature-detect, D1 inline
// storage, the no-R2 size cap, and the R2 path. Mocks D1 + Request; CLAIMS_KV
// is omitted so rateLimit() fails open.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleEvidenceFile } from '../../src/api/evidence-file.js';

// tableExists=true unless tableMissing is set. Records INSERTs in `calls`.
// entTable/entRow drive the entitlements paywall check: entTable defaults false
// so the paywall is inert for the pre-existing tests (default-open).
function makeDB({ learnerRow, tableMissing = false, entTable = false, entRow = null } = {}) {
  const calls = [];
  const respond = (sql) => {
    // entitlementsTableExists reads COUNT(*) AS n; the evidence_files check reads 1 AS ok.
    if (sql.includes('sqlite_master') && sql.includes('entitlements')) return { n: entTable ? 1 : 0 };
    if (sql.includes('sqlite_master')) return tableMissing ? null : { ok: 1 };
    if (sql.includes('FROM learners')) return learnerRow;
    if (sql.includes('FROM entitlements')) return entRow;
    return null;
  };
  return {
    calls,
    prepare(sql) {
      return {
        bind(...args) {
          calls.push({ sql, args });
          return {
            async first() { return respond(sql); },
            async run() { return { success: true }; },
          };
        },
        // sqlite_master check binds nothing in some callers; support no-bind first().
        async first() { return respond(sql); },
      };
    },
  };
}

function makeReq({ method = 'POST', headers = {}, bytes = new Uint8Array([1, 2, 3]) } = {}) {
  const lower = {};
  for (const k of Object.keys(headers)) lower[k.toLowerCase()] = headers[k];
  return {
    method,
    headers: { get: (k) => lower[k.toLowerCase()] ?? null },
    url: 'https://teachplay.dev/api/evidence-file',
    async arrayBuffer() { return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength); },
  };
}
const lastInsert = (db) => [...db.calls].reverse().find((c) => /INSERT INTO evidence_files/.test(c.sql));

test('evidence-file: 401 when no learner id', async () => {
  const db = makeDB({ learnerRow: null });
  const res = await handleEvidenceFile(makeReq({}), { DB: db });
  assert.equal(res.status, 401);
});

test('evidence-file: 403 when learner not found', async () => {
  const db = makeDB({ learnerRow: null });
  const res = await handleEvidenceFile(makeReq({ headers: { 'X-Learner-ID': 'nope' } }), { DB: db });
  assert.equal(res.status, 403);
});

test('evidence-file: 403 when token rejected', async () => {
  const db = makeDB({ learnerRow: { id: 'L1', session_token: 'real' } });
  const res = await handleEvidenceFile(makeReq({ headers: { 'X-Learner-ID': 'L1' } }), { DB: db });
  assert.equal(res.status, 403);
});

test('evidence-file: 503 pre-migration (table absent)', async () => {
  const db = makeDB({ learnerRow: { id: 'L1', session_token: 'tok' }, tableMissing: true });
  const res = await handleEvidenceFile(makeReq({ headers: { 'X-Learner-ID': 'L1', 'X-Learner-Token': 'tok' } }), { DB: db });
  assert.equal(res.status, 503);
});

test('evidence-file: 402 when paywall on and learner not entitled', async () => {
  const db = makeDB({ learnerRow: { id: 'L1', session_token: 'tok' }, entTable: true, entRow: null });
  const res = await handleEvidenceFile(
    makeReq({ headers: { 'X-Learner-ID': 'L1', 'X-Learner-Token': 'tok' } }),
    { DB: db, PAYWALL_ENABLED: '1' },
  );
  assert.equal(res.status, 402);
  const out = JSON.parse(await res.text());
  assert.equal(out.code, 'payment_required');
});

test('evidence-file: paywall on + active entitlement -> upload proceeds (stores)', async () => {
  const db = makeDB({
    learnerRow: { id: 'L1', session_token: 'tok' },
    entTable: true,
    entRow: { tier: 'paid', source: 'stripe', status: 'active', expires_at: null },
  });
  const res = await handleEvidenceFile(
    makeReq({ headers: { 'X-Learner-ID': 'L1', 'X-Learner-Token': 'tok', 'X-File-Name': 'a.txt', 'X-Deliverable': 'D1' } }),
    { DB: db, PAYWALL_ENABLED: '1' },
  );
  assert.notEqual(res.status, 402);
  assert.equal(res.status, 200);
});

test('evidence-file: stores inline in D1 and returns { Id, Key } when no R2', async () => {
  const db = makeDB({ learnerRow: { id: 'L1', session_token: 'tok' } });
  const res = await handleEvidenceFile(makeReq({
    headers: { 'X-Learner-ID': 'L1', 'X-Learner-Token': 'tok', 'X-File-Name': encodeURIComponent('shot.png'), 'X-File-Type': 'image/png' },
    bytes: new Uint8Array([10, 20, 30, 40]),
  }), { DB: db });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.Id, 'returns an Id');
  assert.match(body.Key, /^evidence-uploads\//);
  assert.equal(body.storage, 'd1');
  const ins = lastInsert(db);
  assert.ok(ins, 'inserted a row');
  // (id, learner_id, deliverable_id, file_name, file_size, file_type, storage, r2_key, file_b64)
  assert.equal(ins.args[1], 'L1');
  assert.equal(ins.args[3], 'shot.png');
  assert.equal(ins.args[4], 4);          // size
  assert.equal(ins.args[6], 'd1');       // storage
  assert.equal(ins.args[7], null);       // no r2 key
  assert.equal(ins.args[8], Buffer.from([10, 20, 30, 40]).toString('base64')); // inline b64
});

test('evidence-file: 413 when file exceeds D1 cap and no R2', async () => {
  const db = makeDB({ learnerRow: { id: 'L1', session_token: 'tok' } });
  const big = new Uint8Array(1_300_000).fill(65); // ~1.3 MB -> base64 ~1.73 MB > cap
  const res = await handleEvidenceFile(makeReq({
    headers: { 'X-Learner-ID': 'L1', 'X-Learner-Token': 'tok' }, bytes: big,
  }), { DB: db });
  assert.equal(res.status, 413);
  assert.equal(lastInsert(db), undefined, 'nothing inserted on cap rejection');
});

test('evidence-file: uses R2 when EVIDENCE_BUCKET is bound', async () => {
  const db = makeDB({ learnerRow: { id: 'L1', session_token: 'tok' } });
  const puts = [];
  const EVIDENCE_BUCKET = { async put(key, body, opts) { puts.push({ key, opts }); }, async delete() {} };
  const big = new Uint8Array(2_000_000).fill(66); // 2 MB — fine for R2
  const res = await handleEvidenceFile(makeReq({
    headers: { 'X-Learner-ID': 'L1', 'X-Learner-Token': 'tok', 'X-File-Name': encodeURIComponent('demo.mp4'), 'X-File-Type': 'video/mp4' },
    bytes: big,
  }), { DB: db, EVIDENCE_BUCKET });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.storage, 'r2');
  assert.equal(puts.length, 1, 'wrote one R2 object');
  assert.match(puts[0].key, /^evidence\/L1\//);
  const ins = lastInsert(db);
  assert.equal(ins.args[6], 'r2');       // storage
  assert.match(ins.args[7], /^evidence\/L1\//); // r2_key
  assert.equal(ins.args[8], null);       // no inline b64
});

test('evidence-file: empty body => 400', async () => {
  const db = makeDB({ learnerRow: { id: 'L1', session_token: 'tok' } });
  const res = await handleEvidenceFile(makeReq({
    headers: { 'X-Learner-ID': 'L1', 'X-Learner-Token': 'tok' }, bytes: new Uint8Array([]),
  }), { DB: db });
  assert.equal(res.status, 400);
});
