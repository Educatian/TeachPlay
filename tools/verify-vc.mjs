#!/usr/bin/env node
/**
 * Verify a signed W3C Verifiable Credential against the teachplay.dev
 * issuer's public key (loaded from tools/keys/issuer-ed25519.public.json —
 * in a real verifier that key would be resolved from the issuer's
 * did:web DID document).
 *
 * Usage:
 *   node tools/verify-vc.mjs <signed.json>
 *
 * Exit code 0 on pass, 1 on fail.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';
import { cryptosuite as eddsaRdfc2022 } from '@digitalbazaar/eddsa-rdfc-2022-cryptosuite';
import { DataIntegrityProof } from '@digitalbazaar/data-integrity';
import * as vc from '@digitalbazaar/vc';
import jsonld from 'jsonld';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const inputArg = process.argv[2];
if (!inputArg) {
  console.error('Usage: node tools/verify-vc.mjs <signed.json>');
  process.exit(1);
}

const suite = new DataIntegrityProof({ cryptosuite: eddsaRdfc2022 });

// Resolve any did:web DID under teachplay.dev to a local did.json on disk.
// did:web:teachplay.dev             → .well-known/did.json
// did:web:teachplay.dev:endorsers:X → endorsers/X/did.json
function didToLocalPath(did) {
  if (!did.startsWith('did:web:teachplay.dev')) return null;
  const rest = did.slice('did:web:teachplay.dev'.length);
  if (rest === '') return path.join(ROOT, '.well-known', 'did.json');
  if (rest.startsWith(':')) {
    const segments = rest.slice(1).split(':');
    return path.join(ROOT, ...segments, 'did.json');
  }
  return null;
}

const didDocCache = new Map();
async function loadDidDoc(did) {
  if (didDocCache.has(did)) return didDocCache.get(did);
  const p = didToLocalPath(did);
  if (!p) return null;
  const doc = JSON.parse(await readFile(p, 'utf8'));
  didDocCache.set(did, doc);
  return doc;
}

const nodeLoader = jsonld.documentLoaders.node();

const documentLoader = async (url) => {
  if (typeof url === 'string' && url.startsWith('did:')) {
    // Handle both "did:..." and "did:...#vm-id"
    const [base, frag] = url.split('#');
    const doc = await loadDidDoc(base);
    if (!doc) throw new Error(`Unknown DID: ${base}`);
    if (!frag) return { documentUrl: url, document: doc, contextUrl: null };
    const vm = (doc.verificationMethod || []).find(v => v.id === url);
    if (!vm) throw new Error(`Verification method ${url} not in DID doc`);
    // Return a Multikey export shape the cryptosuite understands.
    return {
      documentUrl: url,
      document: {
        '@context': 'https://w3id.org/security/multikey/v1',
        id: vm.id,
        type: vm.type,
        controller: vm.controller,
        publicKeyMultibase: vm.publicKeyMultibase,
      },
      contextUrl: null,
    };
  }
  return nodeLoader(url);
};

const credential = JSON.parse(await readFile(inputArg, 'utf8'));

// ── BitstringStatusList check ─────────────────────────────────
// The status list credential itself is signed; we're already trusting the
// local issuer key, so resolving the list from its file URL suffices here.
// A real verifier fetches the URL from statusListCredential and re-verifies.
async function resolveStatus(cred) {
  const cs = cred.credentialStatus;
  if (!cs || cs.type !== 'BitstringStatusListEntry') return null;
  const url = cs.statusListCredential;
  const match = url && url.match(/\/credential\/(status-list-[^/]+\.json)$/);
  if (!match) return `(unresolved statusListCredential: ${url})`;
  const local = path.join(ROOT, 'credential', match[1]);
  let list;
  try { list = JSON.parse(await readFile(local, 'utf8')); }
  catch { return `(status list not found locally: ${match[1]})`; }
  const encoded = list.credentialSubject?.encodedList;
  if (typeof encoded !== 'string') return '(encodedList missing)';
  const body = encoded.startsWith('u') ? encoded.slice(1) : encoded;
  const bytes = zlib.gunzipSync(Buffer.from(body, 'base64url'));
  const idx = parseInt(cs.statusListIndex, 10);
  const byteIdx = Math.floor(idx / 8);
  const bitIdx = idx % 8;
  const bit = (bytes[byteIdx] >> (7 - bitIdx)) & 1;
  return bit
    ? `✗ REVOKED (index ${idx}, ${cs.statusPurpose || 'revocation'})`
    : `valid (index ${idx}, ${cs.statusPurpose || 'revocation'})`;
}

const result = await vc.verifyCredential({
  credential,
  suite,
  documentLoader,
  checkStatus: async () => ({ verified: true }),
  // Allow verifying example credentials whose validFrom is in the future
  // (useful pre-cohort-start). Pass `--now=ISO` to override.
  now: process.argv.find((a) => a.startsWith('--now='))?.split('=')[1] || credential.validFrom
});

if (result.verified) {
  console.log('✓ VERIFIED');
  console.log(`  issuer: ${credential.issuer?.id || credential.issuer}`);
  console.log(`  vm:     ${credential.proof.verificationMethod}`);
  console.log(`  suite:  ${credential.proof.cryptosuite}`);
  const statusLine = await resolveStatus(credential);
  if (statusLine) console.log(`  status: ${statusLine}`);
  process.exit(0);
} else {
  console.error('✗ VERIFICATION FAILED');
  const innerErr = result.results?.[0]?.error || result.error;
  if (innerErr) {
    console.error('  name:    ', innerErr.name);
    console.error('  message: ', innerErr.message);
    console.error('  stack:   ', innerErr.stack?.split('\n').slice(0, 5).join('\n'));
    if (innerErr.errors) for (const e of innerErr.errors) console.error('  sub:     ', e.message);
  }
  process.exit(1);
}
