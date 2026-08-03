import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleEnroll } from '../../src/api/enroll.js';

function request(body) {
  return new Request('https://teachplay.dev/api/enroll', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function dbMock({ changes, row }) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      return {
        bind(...args) {
          calls.push({ sql, args });
          return {
            async run() {
              if (/INSERT OR IGNORE/.test(sql)) return { meta: { changes } };
              return { meta: { changes: 0 } };
            },
            async first() {
              return /SELECT id, name, cohort/.test(sql) ? row : null;
            },
          };
        },
      };
    },
  };
}

test('new enrollment receives a session token', async () => {
  const db = dbMock({
    changes: 1,
    row: { id: 'new-learner', name: 'New Learner', cohort: '2026-spring', cred_status: 'none', session_token: 'fresh-token' },
  });
  const data = await (await handleEnroll(request({ name: 'New Learner', email: 'new@example.edu' }), { DB: db })).json();
  assert.equal(data.existing, undefined);
  assert.equal(data.session_token, 'fresh-token');
});

test('existing enrollment never returns its stored token', async () => {
  const db = dbMock({
    changes: 0,
    row: { id: 'existing-learner', name: 'Existing Learner', cohort: '2026-spring', cred_status: 'none', session_token: 'secret-token' },
  });
  const data = await (await handleEnroll(request({ name: 'Existing Learner', email: 'existing@example.edu' }), { DB: db })).json();
  assert.equal(data.existing, true);
  assert.equal(data.auth, 'email-link');
  assert.equal(data.session_token, undefined);
  assert.equal(db.calls.some((call) => /UPDATE learners SET session_token/.test(call.sql)), false);
});
