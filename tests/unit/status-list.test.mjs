// Unit coverage for the BitstringStatusList revocation primitives: a wrong
// getBit/setBit or a broken gzip+base64url round-trip would silently revoke
// the wrong credential, and no test exercised this path before.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getBit, setBit, encodeBitstring, decodeBitstring, buildStatusEntry, statusListUrl,
} from '../../src/lib/status-list.js';

test('setBit/getBit: round-trip flips only the target index', () => {
  const bits = new Uint8Array(8); // 64 bits
  for (const i of [0, 7, 8, 63]) {
    setBit(bits, i, 1);
    assert.equal(getBit(bits, i), 1, `bit ${i} should be set`);
  }
  // Every other index stays 0.
  for (let i = 0; i < 64; i++) {
    const expected = [0, 7, 8, 63].includes(i) ? 1 : 0;
    assert.equal(getBit(bits, i), expected, `bit ${i}`);
  }
});

test('setBit: reinstate (value 0) clears the bit', () => {
  const bits = new Uint8Array(2);
  setBit(bits, 5, 1);
  assert.equal(getBit(bits, 5), 1);
  setBit(bits, 5, 0);
  assert.equal(getBit(bits, 5), 0);
});

test('setBit: out-of-range index throws', () => {
  const bits = new Uint8Array(1); // 8 bits
  assert.throws(() => setBit(bits, 8, 1), /out of range/);
});

test('getBit: out-of-range index reads 0 (sparse list)', () => {
  assert.equal(getBit(new Uint8Array(1), 9999), 0);
});

test('encodeBitstring/decodeBitstring: gzip+base64url round-trip preserves bits', async () => {
  const bits = new Uint8Array(16384); // 131072-bit spec minimum / 8
  setBit(bits, 0, 1);
  setBit(bits, 42, 1);
  setBit(bits, 131071, 1);

  const encoded = await encodeBitstring(bits);
  assert.equal(typeof encoded, 'string');
  assert.equal(encoded[0], 'u', 'multibase base64url-no-pad prefix');

  const decoded = await decodeBitstring(encoded);
  assert.equal(decoded.length, bits.length);
  assert.equal(getBit(decoded, 0), 1);
  assert.equal(getBit(decoded, 42), 1);
  assert.equal(getBit(decoded, 131071), 1);
  assert.equal(getBit(decoded, 1), 0);
});

test('buildStatusEntry: wires index + cohort URL correctly', () => {
  const entry = buildStatusEntry('2026-spring', 17);
  assert.equal(entry.type, 'BitstringStatusListEntry');
  assert.equal(entry.statusPurpose, 'revocation');
  assert.equal(entry.statusListIndex, '17');
  assert.equal(entry.statusListCredential, statusListUrl('2026-spring'));
  assert.equal(entry.id, statusListUrl('2026-spring') + '#17');
});
