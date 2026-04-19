#!/usr/bin/env node
/**
 * Generate an Ed25519 keypair for the teachplay.dev issuer.
 *
 * Writes:
 *   tools/keys/issuer-ed25519.private.json   (gitignored; private)
 *   tools/keys/issuer-ed25519.public.json    (public multikey, safe to commit)
 *   .well-known/did.json                     (did:web:teachplay.dev document)
 *
 * Usage:
 *   node tools/gen-keypair.js
 *   node tools/gen-keypair.js --force       # overwrite existing key
 */

import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const KEY_DIR = path.join(ROOT, 'tools', 'keys');
const PRIVATE_PATH = path.join(KEY_DIR, 'issuer-ed25519.private.json');
const PUBLIC_PATH = path.join(KEY_DIR, 'issuer-ed25519.public.json');
const DID_PATH = path.join(ROOT, '.well-known', 'did.json');

const DID = 'did:web:teachplay.dev';
const force = process.argv.includes('--force');

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
      'https://w3id.org/security/multikey/v1'
    ],
    id: DID,
    verificationMethod: [{
      id: keyPair.id,
      type: 'Multikey',
      controller: DID,
      publicKeyMultibase: keyPair.publicKeyMultibase
    }],
    assertionMethod: [keyPair.id],
    authentication: [keyPair.id]
  };
  await writeFile(DID_PATH, JSON.stringify(didDoc, null, 2) + '\n');

  console.log('✓ Ed25519 keypair generated');
  console.log(`  private → ${path.relative(ROOT, PRIVATE_PATH)}  (gitignored)`);
  console.log(`  public  → ${path.relative(ROOT, PUBLIC_PATH)}`);
  console.log(`  did.json → ${path.relative(ROOT, DID_PATH)}`);
  console.log(`  DID verificationMethod: ${keyPair.id}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
