// Regression test for the verifier fix: the signed example credential must pass
// the Ed25519 signature check through the public /api/verify-credential handler.
// Before the fix (vc.verify instead of vc.verifyCredential) this was always false.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { handleVerifyCredential } from '../../src/api/verify-credential.js';

const here = dirname(fileURLToPath(import.meta.url));
const signed = JSON.parse(
  await readFile(join(here, '../../credential/assertion-example-v3.json'), 'utf8')
);

function reqWith(body) {
  return {
    method: 'POST',
    headers: { get: () => null },
    async json() { return body; },
  };
}

test('verify-credential: signed example passes the Ed25519 signature check', async () => {
  // Keep the test offline — the handler's separate revocation check would
  // otherwise fetch the live status list. Force it to the "not checked" branch.
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('offline test'); };
  try {
    const res = await handleVerifyCredential(reqWith(signed), {});
    const data = JSON.parse(await res.text());
    const sig = data.checks.find((c) => c.name === 'signature');
    assert.ok(sig, 'signature check present');
    assert.equal(sig.ok, true, `signature should verify — got: ${sig.detail}`);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('verify-credential: a tampered credential fails the signature check', async () => {
  const tampered = structuredClone(signed);
  // Mutate a signed field; the proof should no longer verify.
  if (tampered.credentialSubject) tampered.credentialSubject.name = 'Mallory Tamper';
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('offline test'); };
  try {
    const res = await handleVerifyCredential(reqWith(tampered), {});
    const data = JSON.parse(await res.text());
    const sig = data.checks.find((c) => c.name === 'signature');
    assert.equal(sig.ok, false, 'tampered credential must not verify');
  } finally {
    globalThis.fetch = realFetch;
  }
});
