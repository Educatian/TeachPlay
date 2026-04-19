/**
 * BitstringStatusList helpers for the teachplay Worker (KV-backed).
 *
 * Mirrors tools/status-list.mjs but for the V8 isolate runtime:
 *   - gzip via CompressionStream/DecompressionStream (no node:zlib).
 *   - base64url via btoa/atob (no Buffer).
 *   - state lives in two KV namespaces instead of files on disk.
 *
 * Layout per cohort slug:
 *   STATUS_BITS[slug]   → raw bitstring bytes (size/8 bytes, binary)
 *   STATUS_INDEX[slug]  → decimal ASCII of the next free index
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

// ── KV helpers ────────────────────────────────────────────────
export async function readBits(env, slug, size = DEFAULT_BITSTRING_SIZE) {
  const buf = await env.STATUS_BITS.get(slug, { type: 'arrayBuffer' });
  if (!buf) return new Uint8Array(size / 8);
  return new Uint8Array(buf);
}

export async function writeBits(env, slug, bytes) {
  await env.STATUS_BITS.put(slug, bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
}

// Allocate the next free index for this cohort. Not atomic — two
// concurrent callers can read the same `next` and both `put(next+1)`,
// producing one collision. Acceptable for a demo-scale Worker; the
// real fix is a Durable Object singleton per slug or a D1 UPDATE.
export async function allocateIndex(env, slug, size = DEFAULT_BITSTRING_SIZE) {
  const raw = await env.STATUS_INDEX.get(slug);
  const next = raw == null ? 0 : parseInt(raw, 10);
  if (!Number.isFinite(next) || next < 0) throw new Error(`status-index[${slug}] corrupt: ${raw}`);
  if (next >= size) throw new Error(`Status list '${slug}' is full (${size} indices used)`);
  await env.STATUS_INDEX.put(slug, String(next + 1));
  return next;
}

// ── status list credential shape ──────────────────────────────
export async function buildSignedStatusList(env, slug, size = DEFAULT_BITSTRING_SIZE) {
  const bits = await readBits(env, slug, size);
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
