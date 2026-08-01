import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { handleAdminApprove } from '../../src/api/admin-approve.js';
import { ALL_CRITERION_IDS } from '../../src/lib/rubric.js';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

function request(body) {
  return new Request('https://teachplay.dev/api/admin/approve', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'CF-Access-Authenticated-User-Email': 'instructor@example.edu',
    },
    body: JSON.stringify(body),
  });
}

function dbMock({ completed = 0, rubric = false } = {}) {
  const updates = [];
  const db = {
    updates,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (/FROM learners WHERE id/.test(sql)) return { id: 'L1', name: 'Demo Learner', email: 'demo@example.edu', cohort: 'demo', cred_status: 'pending' };
              if (/COUNT\(DISTINCT activity_id\)/.test(sql)) return { cnt: completed };
              if (/survey_completed_at/.test(sql)) return { survey_completed_at: null };
              return null;
            },
            async run() { updates.push({ sql, args }); return { success: true }; },
          };
        },
        async first() {
          if (/sqlite_master/.test(sql)) return rubric ? { n: 2 } : { n: 0 };
          return null;
        },
        async all() {
          if (/PRAGMA table_info/.test(sql)) return { results: [] };
          return { results: [] };
        },
      };
    },
    async batch() {
      if (!rubric) return [{ results: [] }, { results: [] }];
      return [
        { results: ['D1', 'D2', 'D3', 'D4', 'D5'].map((deliverable_id) => ({ deliverable_id })) },
        { results: ALL_CRITERION_IDS.map((criterion_id) => ({ criterion_id, level: 'Proficient' })) },
      ];
    },
  };
  return db;
}

function env(db, claims = []) {
  return {
    DB: db,
    ADMIN_ACCESS_EMAILS: 'instructor@example.edu',
    CLAIMS_KV: {
      claims,
      async put(key, value, options) { claims.push({ key, value: JSON.parse(value), options }); },
      async get() { return null; },
    },
  };
}

test('admin approval refuses an incomplete learner before minting a claim token', async () => {
  const claims = [];
  const res = await handleAdminApprove(request({ learner_id: 'L1' }), env(dbMock(), claims));
  assert.equal(res.status, 422);
  assert.match((await res.json()).reason, /sessions incomplete/);
  assert.equal(claims.length, 0);
});

test('admin approval reaches email and issued state only after the full gate passes', async () => {
  const claims = [];
  const db = dbMock({ completed: 12, rubric: true });
  let emailRequest;
  globalThis.fetch = async (url, options) => {
    if (String(url).includes('api.resend.com')) emailRequest = { url, options };
    return new Response('{}', { status: 200 });
  };
  const res = await handleAdminApprove(request({ learner_id: 'L1' }), env(db, claims));
  assert.equal(res.status, 200);
  assert.equal(claims.length, 1);
  assert.match(claims[0].key, /^claim:/);
  assert.equal(JSON.parse(emailRequest.options.body).to[0], 'demo@example.edu');
  assert.ok(db.updates.some(({ sql }) => /UPDATE learners SET cred_status/.test(sql)));
});
