#!/usr/bin/env node
/**
 * Generate an Ed25519 keypair for a demo *endorser* (distinct from the issuer).
 *
 * The whole point of OBv3 endorsement is that the endorser signs with their
 * own key, under their own DID — we do not issue endorsements on their
 * behalf. This script scaffolds a single endorser so the signing pipeline
 * and credential.html can show a real, verifiable endorsement.
 *
 * Writes:
 *   tools/keys/endorser-<slug>-ed25519.private.json   (gitignored)
 *   tools/keys/endorser-<slug>-ed25519.public.json
 *   endorsers/<slug>/did.json                         (did:web:teachplay.dev:endorsers:<slug>)
 *   endorsers/<slug>/profile.json                     (OBv3 Profile)
 *
 * Usage:
 *   node tools/gen-endorser-key.mjs --slug tcs --name "Tuscaloosa City Schools" \
 *     [--url https://tcs.example.org/] [--force]
 */

import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) args[key] = true;
    else { args[key] = next; i++; }
  }
  return args;
}

const args = parseArgs(process.argv);
if (!args.slug) { console.error('Usage: node tools/gen-endorser-key.mjs --slug <slug> --name "Org Name" [--url <https>]'); process.exit(1); }
if (!/^[a-z0-9-]{2,32}$/.test(args.slug)) { console.error('✗ --slug must be 2–32 chars of [a-z0-9-]'); process.exit(1); }
if (!args.name) { console.error('✗ --name is required'); process.exit(1); }

const SLUG = args.slug;
const DID = `did:web:teachplay.dev:endorsers:${SLUG}`;
const KEY_DIR = path.join(ROOT, 'tools', 'keys');
const PRIVATE_PATH = path.join(KEY_DIR, `endorser-${SLUG}-ed25519.private.json`);
const PUBLIC_PATH = path.join(KEY_DIR, `endorser-${SLUG}-ed25519.public.json`);
const DID_PATH = path.join(ROOT, 'endorsers', SLUG, 'did.json');
const PROFILE_PATH = path.join(ROOT, 'endorsers', SLUG, 'profile.json');
const PROFILE_URL = `https://teachplay.dev/endorsers/${SLUG}/profile.json`;
const force = !!args.force;

async function exists(p) {
  try { await access(p, constants.F_OK); return true; } catch { return false; }
}

async function main() {
  await mkdir(KEY_DIR, { recursive: true });
  await mkdir(path.dirname(DID_PATH), { recursive: true });

  if (!force && await exists(PRIVATE_PATH)) {
    console.error(`Refusing to overwrite ${PRIVATE_PATH} — pass --force to regenerate.`);
    process.exit(1);
  }

  const keyPair = await Ed25519Multikey.generate({ controller: DID });
  keyPair.id = `${DID}#${keyPair.publicKeyMultibase}`;

  const privateExport = await keyPair.export({ publicKey: true, secretKey: true, includeContext: true });
  const publicExport = await keyPair.export({ publicKey: true, includeContext: true });

  await writeFile(PRIVATE_PATH, JSON.stringify(privateExport, null, 2) + '\n');
  await writeFile(PUBLIC_PATH, JSON.stringify(publicExport, null, 2) + '\n');

  const didDoc = {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/multikey/v1',
    ],
    id: DID,
    verificationMethod: [{
      id: keyPair.id,
      type: 'Multikey',
      controller: DID,
      publicKeyMultibase: keyPair.publicKeyMultibase,
    }],
    assertionMethod: [keyPair.id],
    authentication: [keyPair.id],
  };
  await writeFile(DID_PATH, JSON.stringify(didDoc, null, 2) + '\n');

  const profile = {
    '@context': [
      'https://www.w3.org/ns/credentials/v2',
      'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    id: DID,
    type: ['Profile'],
    name: args.name,
    url: args.url || undefined,
    alsoKnownAs: [PROFILE_URL],
  };
  if (!profile.url) delete profile.url;
  await writeFile(PROFILE_PATH, JSON.stringify(profile, null, 2) + '\n');

  console.log(`✓ Endorser keypair generated`);
  console.log(`  slug      → ${SLUG}`);
  console.log(`  DID       → ${DID}`);
  console.log(`  private   → ${path.relative(ROOT, PRIVATE_PATH)}  (gitignored)`);
  console.log(`  public    → ${path.relative(ROOT, PUBLIC_PATH)}`);
  console.log(`  did.json  → ${path.relative(ROOT, DID_PATH)}`);
  console.log(`  profile   → ${path.relative(ROOT, PROFILE_PATH)}`);
  console.log(`  vm id     → ${keyPair.id}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
