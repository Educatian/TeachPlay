#!/usr/bin/env node
/**
 * Sign a W3C Verifiable Credential with the teachplay.dev issuer key
 * using the eddsa-rdfc-2022 cryptosuite (Data Integrity Proof, URDNA2015).
 *
 * Usage:
 *   node tools/sign-vc.mjs <input.json> [output.json]
 *
 * If output is omitted, writes to credential/signed/<basename>.signed.json.
 *
 * The input is expected to already carry issuer.id = did:web:teachplay.dev
 * (or a plain HTTPS issuer identity). The signer ignores any existing
 * `proof` block and replaces it with a real Data Integrity proof.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';
import { cryptosuite as eddsaRdfc2022 } from '@digitalbazaar/eddsa-rdfc-2022-cryptosuite';
import { DataIntegrityProof } from '@digitalbazaar/data-integrity';
import * as vc from '@digitalbazaar/vc';
import jsonld from 'jsonld';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const KEY_PATH = path.join(ROOT, 'tools', 'keys', 'issuer-ed25519.private.json');

function usage() {
  console.error('Usage: node tools/sign-vc.mjs <input.json> [output.json]');
  process.exit(1);
}

const inputArg = process.argv[2];
if (!inputArg) usage();
const inputPath = path.resolve(inputArg);
const outputPath = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.join(ROOT, 'credential', 'signed', path.basename(inputArg).replace(/\.json$/, '') + '.signed.json');

// Document loader with cached copies of OBv3 / W3C VC 2.0 / DI contexts.
// For a scaffold we permit network fetch; production should ship a fully
// frozen loader so signing is deterministic and offline-safe.
const nodeDocumentLoader = jsonld.documentLoaders.node();
const documentLoader = async (url) => {
  return nodeDocumentLoader(url);
};

async function loadKey() {
  const raw = JSON.parse(await readFile(KEY_PATH, 'utf8'));
  return await Ed25519Multikey.from(raw);
}

async function main() {
  const credentialRaw = JSON.parse(await readFile(inputPath, 'utf8'));
  // Strip any existing proof — we replace with a real one.
  delete credentialRaw.proof;
  // Drop scaffold-only annotation so it doesn't appear in the signed artifact.
  delete credentialRaw._proof_note;

  const keyPair = await loadKey();
  const suite = new DataIntegrityProof({
    signer: keyPair.signer(),
    cryptosuite: eddsaRdfc2022
  });

  const signed = await vc.issue({
    credential: credentialRaw,
    suite,
    documentLoader
  });

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(signed, null, 2) + '\n');

  console.log('✓ Signed credential');
  console.log(`  input   → ${path.relative(ROOT, inputPath)}`);
  console.log(`  output  → ${path.relative(ROOT, outputPath)}`);
  console.log(`  vm      → ${signed.proof.verificationMethod}`);
  console.log(`  suite   → ${signed.proof.cryptosuite}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
