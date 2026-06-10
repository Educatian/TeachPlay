/**
 * BitstringStatusList helpers for the teachplay Worker (D1-backed).
 *
 * Mirrors tools/status-list.mjs but for the V8 isolate runtime:
 *   - gzip via CompressionStream/DecompressionStream (no node:zlib).
 *   - base64url via btoa/atob (no Buffer).
 *   - state lives in D1 (migration 0007), NOT Workers KV. KV had no
 *     compare-and-swap, so the old get→put allocation and read-modify-write
 *     revocation could race; D1 statements are atomic.
 *
 * D1 layout per cohort slug:
 *   status_alloc(cohort, next_index)        → atomic index counter
 *   status_revocations(cohort, idx, …)      → one row per revoked index
 *   status_index_map(cohort, idx, …)        → allocation audit trail
 * The bitstring is rebuilt from status_revocations on each read.
 *
 * Worker-issued credentials reference the list at the dynamic URL
 *     https://teachplay.dev/api/status-list/<slug>
 * which /api/status-list signs on demand. That URL is deliberately
 * distinct from the CLI's credential/status-list-<slug>.json so the
 * two stores never collide.
 */
import { signCredential } from './sign.js';

export const DEFAULT_BITSTRING_SIZE = 131072; // 16 KiB, spec-recommended minimum
export const ISSUER_DID = 'did:web:teachplay.dev';
export const STATUS_LIST_ORIGIN = 'https://teachplay.dev';

export function statusListUrl(slug) {
  return `${STATUS_LIST_ORIGIN}/api/status-list/${slug}`;
}

// ── bitstring encoding ────────────────────────────────────────
function b64urlEncode(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function gzip(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzip(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function encodeBitstring(bytes) {
  return 'u' + b64urlEncode(await gzip(bytes));
}

export async function decodeBitstring(encoded) {
  if (typeof encoded !== 'string') throw new Error('encodedList must be a string');
  const body = encoded.startsWith('u') ? encoded.slice(1) : encoded;
  return gunzip(b64urlDecode(body));
}

export function getBit(bytes, index) {
  const byteIdx = Math.floor(index / 8);
  const bitIdx = index % 8;
  if (byteIdx >= bytes.length) return 0;
  return (bytes[byteIdx] >> (7 - bitIdx)) & 1;
}

export function setBit(bytes, index, value) {
  const byteIdx = Math.floor(index / 8);
  const bitIdx = index % 8;
  if (byteIdx >= bytes.length) throw new Error(`index ${index} out of range (${bytes.length * 8} bits)`);
  if (value) bytes[byteIdx] |= (1 << (7 - bitIdx));
  else bytes[byteIdx] &= ~(1 << (7 - bitIdx));
}

// ── D1-backed status state (atomic; replaces the KV read-modify-write) ──

// Atomically allocate the next free index for this cohort. The single
// INSERT … ON CONFLICT … RETURNING statement is atomic in D1, so two
// concurrent issuances can never receive the same index (the KV path
// could, via a get→put race).
export async function allocateIndex(env, slug, size = DEFAULT_BITSTRING_SIZE, meta = {}) {
  const row = await env.DB.prepare(
    `INSERT INTO status_alloc (cohort, next_index) VALUES (?, 1)
     ON CONFLICT(cohort) DO UPDATE SET next_index = next_index + 1
     RETURNING next_index - 1 AS idx`
  ).bind(slug).first();
  const idx = row?.idx ?? 0;
  if (idx >= size) throw new Error(`Status list '${slug}' is full (${size} indices used)`);
  // Audit trail: which credential/learner got this index.
  await env.DB.prepare(
    `INSERT OR IGNORE INTO status_index_map (cohort, idx, credential_id, learner_id) VALUES (?, ?, ?, ?)`
  ).bind(slug, idx, meta.credential_id ?? null, meta.learner_id ?? null).run();
  return idx;
}

// Revoke (value truthy) or reinstate (value falsy) one index. Both are
// idempotent single statements — no read-modify-write race like the KV
// bits blob had. Returns the previous state (1 = was revoked, else 0).
export async function setRevocation(env, slug, index, value, meta = {}) {
  const existing = await env.DB.prepare(
    `SELECT 1 FROM status_revocations WHERE cohort = ? AND idx = ?`
  ).bind(slug, index).first();
  const previous = existing ? 1 : 0;
  if (value) {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO status_revocations (cohort, idx, learner_id, credential_id) VALUES (?, ?, ?, ?)`
    ).bind(slug, index, meta.learner_id ?? null, meta.credential_id ?? null).run();
  } else {
    await env.DB.prepare(`DELETE FROM status_revocations WHERE cohort = ? AND idx = ?`)
      .bind(slug, index).run();
  }
  return previous;
}

export async function readRevokedIndices(env, slug) {
  const res = await env.DB.prepare(`SELECT idx FROM status_revocations WHERE cohort = ?`)
    .bind(slug).all();
  return (res.results || []).map(r => r.idx);
}

// ── status list credential shape ──────────────────────────────
// Rebuild the raw bitstring for a cohort from its revocation rows. Separated
// from signing so it can be unit-tested without key material.
export async function buildStatusBitstring(env, slug, size = DEFAULT_BITSTRING_SIZE) {
  const bits = new Uint8Array(size / 8);
  for (const idx of await readRevokedIndices(env, slug)) {
    if (idx >= 0 && idx < size) setBit(bits, idx, 1);
  }
  return bits;
}

export async function buildSignedStatusList(env, slug, size = DEFAULT_BITSTRING_SIZE) {
  const bits = await buildStatusBitstring(env, slug, size);
  const encoded = await encodeBitstring(bits);
  const url = statusListUrl(slug);
  const credential = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    id: url,
    type: ['VerifiableCredential', 'BitstringStatusListCredential'],
    issuer: ISSUER_DID,
    validFrom: new Date().toISOString(),
    credentialSubject: {
      id: `${url}#list`,
      type: 'BitstringStatusList',
      statusPurpose: 'revocation',
      encodedList: encoded,
    },
  };
  return signCredential(credential, env);
}

export function buildStatusEntry(slug, index) {
  const url = statusListUrl(slug);
  return {
    id: `${url}#${index}`,
    type: 'BitstringStatusListEntry',
    statusPurpose: 'revocation',
    statusListIndex: String(index),
    statusListCredential: url,
  };
}
