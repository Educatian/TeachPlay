// Unit coverage for the /api/log/* endpoint: auth gate, validation, size caps,
// and that content lands in the right table. Mocks D1 + the Request; CLAIMS_KV
// is omitted so rateLimit() fails open.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleLog } from '../../src/api/log.js';

function makeDB(learnerRow) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      return {
        bind(...args) {
          calls.push({ sql, args });
          return {
            async first() { return sql.includes('FROM learners') ? learnerRow : null; },
            async run() { return { success: true }; },
          };
        },
      };
    },
  };
}
function makeReq({ method = 'POST', headers = {}, body } = {}) {
  const lower = {};
  for (const k of Object.keys(headers)) lower[k.toLowerCase()] = headers[k];
  return {
    method,
    headers: { get: (k) => lower[k.toLowerCase()] ?? null },
    async json() { if (body === undefined) throw new Error('no body'); return body; },
  };
}
const lastInsert = (db) => db.calls[db.calls.length - 1];

test('log: 401 when no learner id', async () => {
  const db = makeDB(null);
  const res = await handleLog(makeReq({ body: { user_prompt: 'x' } }), { DB: db }, {}, 'conversation');
  assert.equal(res.status, 401);
});

test('log: 403 when learner not found', async () => {
  const db = makeDB(null);
  const res = await handleLog(makeReq({ headers: { 'X-Learner-ID': 'nope' }, body: { user_prompt: 'x' } }), { DB: db }, {}, 'conversation');
  assert.equal(res.status, 403);
});

test('log: 403 when token rejected (stored token, none provided)', async () => {
  const db = makeDB({ id: 'L1', session_token: 'real-token' });
  const res = await handleLog(makeReq({ headers: { 'X-Learner-ID': 'L1' }, body: { source: 't', user_prompt: 'hi' } }), { DB: db }, {}, 'conversation');
  assert.equal(res.status, 403);
});

test('log conversation: stores full prompt + response in ai_conversations', async () => {
  const db = makeDB({ id: 'L1', session_token: 'tok' });
  const res = await handleLog(makeReq({
    headers: { 'X-Learner-ID': 'L1', 'X-Learner-Token': 'tok' },
    body: { source: 'touchpoint', session_id: 's3', user_prompt: 'Design a loop', response: 'Here is a loop', model: 'gemini', ok: true, duration_ms: 1200 },
  }), { DB: db }, {}, 'conversation');
  assert.equal(res.status, 200);
  const ins = lastInsert(db);
  assert.match(ins.sql, /INSERT INTO ai_conversations/);
  // args: learner_id, source, session_id, lo_id, model, system_prompt, user_prompt, response, ok, error, duration_ms
  assert.equal(ins.args[0], 'L1');
  assert.equal(ins.args[2], 's3');
  assert.equal(ins.args[6], 'Design a loop');
  assert.equal(ins.args[7], 'Here is a loop');
  assert.equal(ins.args[8], 1); // ok -> 1
});

test('log conversation: missing user_prompt => 400', async () => {
  const db = makeDB({ id: 'L1', session_token: 'tok' });
  const res = await handleLog(makeReq({ headers: { 'X-Learner-ID': 'L1', 'X-Learner-Token': 'tok' }, body: { source: 't' } }), { DB: db }, {}, 'conversation');
  assert.equal(res.status, 400);
});

test('log conversation: oversized prompt is capped at 16000 chars', async () => {
  const db = makeDB({ id: 'L1', session_token: 'tok' });
  const big = 'a'.repeat(20000);
  const res = await handleLog(makeReq({ headers: { 'X-Learner-ID': 'L1', 'X-Learner-Token': 'tok' }, body: { user_prompt: big } }), { DB: db }, {}, 'conversation');
  assert.equal(res.status, 200);
  assert.equal(lastInsert(db).args[6].length, 16000);
});

test('log gameplay: stores event + JSON detail in gameplay_events', async () => {
  const db = makeDB({ id: 'L1', session_token: 'tok' });
  const res = await handleLog(makeReq({
    headers: { 'X-Learner-ID': 'L1', 'X-Learner-Token': 'tok' },
    body: { game: 's02', session_id: 's2', event: 'score', detail: { pct: 75 }, correct: 1, score_raw: 6, score_max: 8 },
  }), { DB: db }, {}, 'gameplay');
  assert.equal(res.status, 200);
  const ins = lastInsert(db);
  assert.match(ins.sql, /INSERT INTO gameplay_events/);
  // args: learner_id, game, session_id, event, detail, correct, score_raw, score_max
  assert.equal(ins.args[1], 's02');
  assert.equal(ins.args[2], 's2');
  assert.equal(ins.args[3], 'score');
  assert.equal(ins.args[4], JSON.stringify({ pct: 75 }));
  assert.equal(ins.args[5], 1);
  assert.equal(ins.args[6], 6);
});

test('log gameplay: missing game/event => 400', async () => {
  const db = makeDB({ id: 'L1', session_token: 'tok' });
  const res = await handleLog(makeReq({ headers: { 'X-Learner-ID': 'L1', 'X-Learner-Token': 'tok' }, body: { game: 's02' } }), { DB: db }, {}, 'gameplay');
  assert.equal(res.status, 400);
});

test('log: legacy row binds the first provided token (TOFU)', async () => {
  const db = makeDB({ id: 'L1', session_token: null });
  const res = await handleLog(makeReq({
    headers: { 'X-Learner-ID': 'L1', 'X-Learner-Token': 'fresh' },
    body: { user_prompt: 'hi' },
  }), { DB: db }, {}, 'conversation');
  assert.equal(res.status, 200);
  assert.ok(db.calls.some((c) => /UPDATE learners SET session_token/.test(c.sql) && c.args[0] === 'fresh'),
    'expected a TOFU bind UPDATE with the provided token');
});
