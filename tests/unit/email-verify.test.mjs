import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleEmailVerify } from '../../src/api/email-verify.js';

function request(query = '') {
  return new Request(`https://teachplay.dev/api/email-verify${query}`);
}

test('email claim rejects a missing token before touching storage', async () => {
  let reads = 0;
  const res = await handleEmailVerify(request(), { CLAIMS_KV: { async get() { reads += 1; return null; } } });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error, 'Missing token');
  assert.equal(reads, 0);
});

test('email claim rejects an already-used token without reissuing', async () => {
  const res = await handleEmailVerify(request('?t=used-token'), {
    CLAIMS_KV: { async get() { return JSON.stringify({ used: true }); } },
  });
  assert.equal(res.status, 409);
  assert.match((await res.json()).error, /already been used/i);
});
