#!/usr/bin/env node
/**
 * BitstringStatusList (W3C VC Status List) tooling for teachplay.dev.
 *
 * One status list per cohort. Each learner's VC carries a `credentialStatus`
 * pointing to an index in the list; flipping that bit revokes the credential.
 *
 * State:
 *   credential/status-list-<slug>.json        — the signed BitstringStatusListCredential (published)
 *   credential/status-list-registry.json      — sidecar map of learner-id → index (gitignored of PII)
 *
 * Subcommands:
 *   init      [--list <slug>] [--size <bits>]
 *   allocate  <learner-id> [--list <slug>] [--size <bits>]
 *   revoke    <learner-id> [--list <slug>]
 *   reinstate <learner-id> [--list <slug>]
 *   check     <learner-id> [--list <slug>]
 *   info      [--list <slug>]
 *
 * The registry is source-of-truth for learner → index mapping (which the
 * bitstring itself cannot encode — that is the point of the privacy design).
 * The signed credential is source-of-truth for the bits. `revoke` updates
 * both and re-signs; `allocate` updates only the registry.
 *
 * Spec: https://www.w3.org/TR/vc-bitstring-status-list/
 */

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';
import { cryptosuite as eddsaRdfc2022 } from '@digitalbazaar/eddsa-rdfc-2022-cryptosuite';
import { DataIntegrityProof } from '@digitalbazaar/data-integrity';
import * as vc from '@digitalbazaar/vc';
import jsonld from 'jsonld';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const KEY_PATH = path.join(ROOT, 'tools', 'keys', 'issuer-ed25519.private.json');
const REGISTRY_PATH = path.join(ROOT, 'credential', 'status-list-registry.json');

const ISSUER_DID = 'did:web:teachplay.dev';
const DEFAULT_LIST = '2026-spring';
const DEFAULT_SIZE = 131072;   // 16 KiB bitstring — the spec's recommended minimum for k-anonymity

// ── arg parsing ────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) { args[key] = true; }
      else { args[key] = next; i++; }
    } else args._.push(a);
  }
  return args;
}

function usage(msg) {
  if (msg) console.error('✗ ' + msg);
  console.error(`Usage:
  node tools/status-list.mjs init      [--list <slug>] [--size <bits>]
  node tools/status-list.mjs allocate  <learner-id> [--list <slug>] [--size <bits>]
  node tools/status-list.mjs revoke    <learner-id> [--list <slug>]
  node tools/status-list.mjs reinstate <learner-id> [--list <slug>]
  node tools/status-list.mjs check     <learner-id> [--list <slug>]
  node tools/status-list.mjs info      [--list <slug>]`);
  process.exit(1);
}

// ── paths / registry ──────────────────────────────────────────
function listFileFor(slug) {
  return path.join(ROOT, 'credential', `status-list-${slug}.json`);
}
function listUrlFor(slug) {
  return `https://teachplay.dev/credential/status-list-${slug}.json`;
}
async function exists(p) {
  try { await access(p, constants.F_OK); return true; } catch { return false; }
}
async function readRegistry() {
  if (!(await exists(REGISTRY_PATH))) return { lists: {} };
  return JSON.parse(await readFile(REGISTRY_PATH, 'utf8'));
}
async function writeRegistry(r) {
  await mkdir(path.dirname(REGISTRY_PATH), { recursive: true });
  await writeFile(REGISTRY_PATH, JSON.stringify(r, null, 2) + '\n');
}

// ── bitstring encoding ────────────────────────────────────────
function encodeBitstring(bytes) {
  const gz = zlib.gzipSync(Buffer.from(bytes));
  return 'u' + gz.toString('base64url');
}
function decodeBitstring(encoded) {
  if (typeof encoded !== 'string') throw new Error('encodedList must be a string');
  const body = encoded.startsWith('u') ? encoded.slice(1) : encoded;
  const gz = Buffer.from(body, 'base64url');
  const raw = zlib.gunzipSync(gz);
  return new Uint8Array(raw);
}
function getBit(bytes, index) {
  const byteIdx = Math.floor(index / 8);
  const bitIdx = index % 8;
  if (byteIdx >= bytes.length) return 0;
  return (bytes[byteIdx] >> (7 - bitIdx)) & 1;
}
function setBit(bytes, index, value) {
  const byteIdx = Math.floor(index / 8);
  const bitIdx = index % 8;
  if (byteIdx >= bytes.length) throw new Error(`index ${index} out of range (${bytes.length * 8} bits)`);
  if (value) bytes[byteIdx] |= (1 << (7 - bitIdx));
  else bytes[byteIdx] &= ~(1 << (7 - bitIdx));
}

// ── signing ───────────────────────────────────────────────────
async function loadKey() {
  const raw = JSON.parse(await readFile(KEY_PATH, 'utf8'));
  return Ed25519Multikey.from(raw);
}
const nodeLoader = jsonld.documentLoaders.node();
const documentLoader = async (url) => nodeLoader(url);

async function signStatusList(credential) {
  delete credential.proof;
  const keyPair = await loadKey();
  const suite = new DataIntegrityProof({
    signer: keyPair.signer(),
    cryptosuite: eddsaRdfc2022,
  });
  return vc.issue({ credential, suite, documentLoader });
}

// ── status list credential shape ──────────────────────────────
function buildStatusListCredential(slug, size, encodedList) {
  const url = listUrlFor(slug);
  return {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    id: url,
    type: ['VerifiableCredential', 'BitstringStatusListCredential'],
    issuer: ISSUER_DID,
    validFrom: new Date().toISOString(),
    credentialSubject: {
      id: `${url}#list`,
      type: 'BitstringStatusList',
      statusPurpose: 'revocation',
      encodedList,
    },
  };
}

// ── operations ────────────────────────────────────────────────
async function opInit(args) {
  const slug = args.list || DEFAULT_LIST;
  const size = parseInt(args.size || DEFAULT_SIZE, 10);
  if (size % 8 !== 0) throw new Error('--size must be a multiple of 8');
  const file = listFileFor(slug);
  if (await exists(file) && !args.force) {
    throw new Error(`${path.relative(ROOT, file)} exists. Pass --force to overwrite.`);
  }

  const bits = new Uint8Array(size / 8);
  const encoded = encodeBitstring(bits);
  const cred = buildStatusListCredential(slug, size, encoded);
  const signed = await signStatusList(cred);

  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(signed, null, 2) + '\n');

  const registry = await readRegistry();
  registry.lists[slug] = {
    credentialUrl: listUrlFor(slug),
    credentialFile: path.relative(ROOT, file).replace(/\\/g, '/'),
    size,
    next: 0,
    entries: {},
  };
  await writeRegistry(registry);

  console.log(`✓ Initialized status list '${slug}'`);
  console.log(`  size   → ${size} bits`);
  console.log(`  file   → ${path.relative(ROOT, file)}`);
  console.log(`  url    → ${listUrlFor(slug)}`);
}

function ensureList(registry, slug) {
  const rec = registry.lists[slug];
  if (!rec) throw new Error(`Status list '${slug}' not initialized. Run 'init --list ${slug}' first.`);
  return rec;
}

async function opAllocate(args) {
  const [, learnerId] = args._;
  if (!learnerId) usage('allocate requires a learner id');
  const slug = args.list || DEFAULT_LIST;

  const registry = await readRegistry();
  if (!registry.lists[slug]) {
    // auto-init for convenience
    await opInit({ list: slug, size: args.size });
    return opAllocate(args);
  }
  const rec = registry.lists[slug];

  if (rec.entries[learnerId] != null) {
    console.log(rec.entries[learnerId]);
    return;
  }
  if (rec.next >= rec.size) throw new Error(`Status list '${slug}' is full (${rec.size} indices used)`);
  const index = rec.next;
  rec.entries[learnerId] = index;
  rec.next = index + 1;
  await writeRegistry(registry);

  console.log(index);
}

async function opSetBit(args, value) {
  const sub = args._[0];
  const learnerId = args._[1];
  if (!learnerId) usage(`${sub} requires a learner id`);
  const slug = args.list || DEFAULT_LIST;

  const registry = await readRegistry();
  const rec = ensureList(registry, slug);
  const index = rec.entries[learnerId];
  if (index == null) throw new Error(`Learner '${learnerId}' is not in list '${slug}'. Issue the credential first, or run allocate.`);

  const file = listFileFor(slug);
  const signedList = JSON.parse(await readFile(file, 'utf8'));
  const bits = decodeBitstring(signedList.credentialSubject.encodedList);
  const prev = getBit(bits, index);
  setBit(bits, index, value ? 1 : 0);
  signedList.credentialSubject.encodedList = encodeBitstring(bits);
  const reSigned = await signStatusList(signedList);
  await writeFile(file, JSON.stringify(reSigned, null, 2) + '\n');

  console.log(`✓ ${value ? 'Revoked' : 'Reinstated'} learner '${learnerId}' (list '${slug}', index ${index})`);
  console.log(`  previous bit → ${prev}`);
  console.log(`  current  bit → ${value ? 1 : 0}`);
}

async function opCheck(args) {
  const [, learnerId] = args._;
  if (!learnerId) usage('check requires a learner id');
  const slug = args.list || DEFAULT_LIST;
  const registry = await readRegistry();
  const rec = ensureList(registry, slug);
  const index = rec.entries[learnerId];
  if (index == null) { console.log('not-issued'); return; }
  const signedList = JSON.parse(await readFile(listFileFor(slug), 'utf8'));
  const bits = decodeBitstring(signedList.credentialSubject.encodedList);
  const bit = getBit(bits, index);
  console.log(`${bit ? 'revoked' : 'valid'} (index ${index}, list ${slug})`);
}

async function opInfo(args) {
  const slug = args.list || DEFAULT_LIST;
  const registry = await readRegistry();
  const rec = ensureList(registry, slug);
  const signedList = JSON.parse(await readFile(listFileFor(slug), 'utf8'));
  const bits = decodeBitstring(signedList.credentialSubject.encodedList);
  let revoked = 0;
  for (const [, idx] of Object.entries(rec.entries)) if (getBit(bits, idx)) revoked++;
  console.log(`list      → ${slug}`);
  console.log(`url       → ${rec.credentialUrl}`);
  console.log(`file      → ${rec.credentialFile}`);
  console.log(`size      → ${rec.size} bits`);
  console.log(`allocated → ${Object.keys(rec.entries).length}`);
  console.log(`revoked   → ${revoked}`);
  console.log(`next idx  → ${rec.next}`);
}

// ── main ──────────────────────────────────────────────────────
const args = parseArgs(process.argv);
const sub = args._[0];
try {
  if (sub === 'init') await opInit(args);
  else if (sub === 'allocate') await opAllocate(args);
  else if (sub === 'revoke') await opSetBit(args, true);
  else if (sub === 'reinstate') await opSetBit(args, false);
  else if (sub === 'check') await opCheck(args);
  else if (sub === 'info') await opInfo(args);
  else usage();
} catch (err) {
  console.error('✗', err.message);
  process.exit(1);
}
