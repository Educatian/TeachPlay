// Unit coverage for the per-learner token policy (TOFU / bind / reject) that
// gates /api/progress, /api/xapi, and now /api/completion-check.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { learnerTokenDecision, randomToken, escapeHtml } from '../../src/lib/security.js';

test('learnerTokenDecision: stored + matching token => ok', () => {
  assert.equal(learnerTokenDecision('tok-abc', 'tok-abc'), 'ok');
});

test('learnerTokenDecision: stored + wrong token => reject', () => {
  assert.equal(learnerTokenDecision('tok-abc', 'tok-xyz'), 'reject');
});

test('learnerTokenDecision: stored + no token => reject (closes the IDOR)', () => {
  assert.equal(learnerTokenDecision('tok-abc', ''), 'reject');
  assert.equal(learnerTokenDecision('tok-abc', null), 'reject');
});

test('learnerTokenDecision: tokenless row + provided token => bind (TOFU)', () => {
  assert.equal(learnerTokenDecision(null, 'fresh-token'), 'bind');
});

test('learnerTokenDecision: tokenless row + no token => reject (post-0006 backfill)', () => {
  assert.equal(learnerTokenDecision(null, ''), 'reject');
  assert.equal(learnerTokenDecision('', ''), 'reject');
});

test('randomToken: 64 hex chars (256-bit), unique', () => {
  const a = randomToken();
  const b = randomToken();
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.notEqual(a, b);
});

test('escapeHtml: neutralizes HTML metacharacters', () => {
  assert.equal(escapeHtml('<b>"x"&\'y\'</b>'), '&lt;b&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/b&gt;');
  assert.equal(escapeHtml(null), '');
});
