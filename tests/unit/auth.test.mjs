// Unit coverage for the constant-time admin compare. No Playwright, no Worker
// runtime — these import the real Worker lib (src is type:module) and exercise
// the pure logic the audit found had zero coverage.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { timingSafeEqualStr, checkAdminAuth } from '../../src/lib/auth.js';

test('timingSafeEqualStr: equal strings match', () => {
  assert.equal(timingSafeEqualStr('s3cr3t-key', 's3cr3t-key'), true);
});

test('timingSafeEqualStr: content mismatch fails', () => {
  assert.equal(timingSafeEqualStr('s3cr3t-key', 's3cr3t-keX'), false);
});

test('timingSafeEqualStr: length mismatch fails (no throw)', () => {
  assert.equal(timingSafeEqualStr('short', 'longer-value'), false);
});

test('timingSafeEqualStr: non-string inputs fail closed', () => {
  assert.equal(timingSafeEqualStr(undefined, 'x'), false);
  assert.equal(timingSafeEqualStr('x', null), false);
  assert.equal(timingSafeEqualStr(123, 123), false);
});

function reqWith(headers) {
  return { headers: { get: (k) => headers[k.toLowerCase()] ?? null } };
}

test('checkAdminAuth: 500 when key unset', () => {
  const r = checkAdminAuth(reqWith({ authorization: 'Bearer abc' }), {});
  assert.equal(r.ok, false);
  assert.equal(r.code, 500);
});

test('checkAdminAuth: 401 on wrong key', () => {
  const r = checkAdminAuth(reqWith({ authorization: 'Bearer wrong' }), { ISSUER_API_KEY: 'right' });
  assert.equal(r.ok, false);
  assert.equal(r.code, 401);
});

test('checkAdminAuth: ok on matching Bearer (case-insensitive)', () => {
  const r = checkAdminAuth(reqWith({ authorization: 'bearer right' }), { ISSUER_API_KEY: 'right' });
  assert.equal(r.ok, true);
});

test('checkAdminAuth: ok on matching x-api-key fallback', () => {
  const r = checkAdminAuth(reqWith({ 'x-api-key': 'right' }), { ISSUER_API_KEY: 'right' });
  assert.equal(r.ok, true);
});
