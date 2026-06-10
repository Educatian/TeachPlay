// Unit coverage for the D1-backed status state (migration 0007). Verifies that
// allocation hands out unique increasing indices, revocation round-trips as
// idempotent row writes, and the bitstring is rebuilt from the rows — the
// fix for the old KV read-modify-write races.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  allocateIndex, setRevocation, readRevokedIndices, buildStatusBitstring, getBit,
} from '../../src/lib/status-list.js';

// Minimal in-memory stand-in for the D1 statements status-list.js issues.
function makeStatusDB() {
  const alloc = new Map();        // cohort -> next_index
  const revoked = new Set();      // "cohort:idx"
  const map = [];
  return {
    _revoked: revoked, _map: map,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (sql.includes('INSERT INTO status_alloc')) {
                const cohort = args[0];
                const next = (alloc.get(cohort) ?? 0) + 1;
                alloc.set(cohort, next);
                return { idx: next - 1 };
              }
              if (sql.includes('SELECT 1 FROM status_revocations')) {
                return revoked.has(`${args[0]}:${args[1]}`) ? { 1: 1 } : null;
              }
              return null;
            },
            async run() {
              if (sql.includes('INSERT OR IGNORE INTO status_revocations')) revoked.add(`${args[0]}:${args[1]}`);
              else if (sql.includes('DELETE FROM status_revocations')) revoked.delete(`${args[0]}:${args[1]}`);
              else if (sql.includes('INSERT OR IGNORE INTO status_index_map')) map.push(args);
              return { success: true };
            },
            async all() {
              if (sql.includes('SELECT idx FROM status_revocations')) {
                const cohort = args[0];
                return { results: [...revoked].filter((k) => k.startsWith(cohort + ':')).map((k) => ({ idx: Number(k.split(':')[1]) })) };
              }
              return { results: [] };
            },
          };
        },
      };
    },
  };
}

test('allocateIndex: hands out unique increasing indices per cohort', async () => {
  const env = { DB: makeStatusDB() };
  assert.equal(await allocateIndex(env, 'c1'), 0);
  assert.equal(await allocateIndex(env, 'c1'), 1);
  assert.equal(await allocateIndex(env, 'c1'), 2);
  // A different cohort has its own counter.
  assert.equal(await allocateIndex(env, 'c2'), 0);
  assert.equal(await allocateIndex(env, 'c1'), 3);
});

test('allocateIndex: records an audit row in status_index_map', async () => {
  const env = { DB: makeStatusDB() };
  await allocateIndex(env, 'c1', undefined, { credential_id: 'cred-1', learner_id: 'L1' });
  assert.equal(env.DB._map.length, 1);
  assert.deepEqual(env.DB._map[0], ['c1', 0, 'cred-1', 'L1']);
});

test('allocateIndex: throws when the list is full', async () => {
  const env = { DB: makeStatusDB() };
  await allocateIndex(env, 'c1', 8); // idx 0
  await allocateIndex(env, 'c1', 8); // idx 1
  // size 1 means only idx 0 is valid; next alloc (idx 2) exceeds it
  await assert.rejects(() => allocateIndex(env, 'c1', 1), /is full/);
});

test('setRevocation: revoke then reinstate round-trips, returns previous state', async () => {
  const env = { DB: makeStatusDB() };
  assert.equal(await setRevocation(env, 'c1', 5, 1), 0);          // was not revoked
  assert.deepEqual(await readRevokedIndices(env, 'c1'), [5]);
  assert.equal(await setRevocation(env, 'c1', 5, 1), 1);          // already revoked (idempotent)
  assert.equal(await setRevocation(env, 'c1', 5, 0), 1);          // reinstate; was revoked
  assert.deepEqual(await readRevokedIndices(env, 'c1'), []);
});

test('buildStatusBitstring: sets exactly the revoked bits', async () => {
  const env = { DB: makeStatusDB() };
  await setRevocation(env, 'c1', 5, 1);
  await setRevocation(env, 'c1', 42, 1);
  const bits = await buildStatusBitstring(env, 'c1');
  assert.equal(getBit(bits, 5), 1);
  assert.equal(getBit(bits, 42), 1);
  assert.equal(getBit(bits, 6), 0);
  assert.equal(getBit(bits, 0), 0);
});
