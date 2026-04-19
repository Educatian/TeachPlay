#!/usr/bin/env node
/**
 * Sign an OBv3 EndorsementCredential using a demo endorser's key.
 *
 * Usage:
 *   node tools/sign-endorsement.mjs --endorser <slug> [--in <input.json>] [--out <output.json>]
 *
 * Defaults:
 *   --in   credential/endorsement-template-v3.json
 *   --out  credential/endorsements/<slug>-<basename>.json
 *
 * The endorser key is looked up at tools/keys/endorser-<slug>-ed25519.private.json.
 * Before calling, run tools/gen-endorser-key.mjs --slug <slug> --name "<Org>".
 *
 * The input template's issuer.id is overwritten with the endorser's DID so
 * that the signed credential correctly identifies who signed it, regardless
 * of what value the template started with.
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
if (!args.endorser) { console.error('Usage: node tools/sign-endorsement.mjs --endorser <slug> [--in <path>] [--out <path>]'); process.exit(1); }

const SLUG = args.endorser;
const DID = `did:web:teachplay.dev:endorsers:${SLUG}`;
const KEY_PATH = path.join(ROOT, 'tools', 'keys', `endorser-${SLUG}-ed25519.private.json`);
const IN_PATH = path.resolve(args.in || path.join(ROOT, 'credential', 'endorsement-template-v3.json'));
const OUT_PATH = path.resolve(args.out || path.join(ROOT, 'credential', 'endorsements', `${SLUG}-${path.basename(IN_PATH).replace(/^endorsement-/, '').replace(/\.json$/, '')}.json`));

async function loadKey() {
  const raw = JSON.parse(await readFile(KEY_PATH, 'utf8'));
  return Ed25519Multikey.from(raw);
}

const nodeLoader = jsonld.documentLoaders.node();
const documentLoader = async (url) => nodeLoader(url);

async function main() {
  const template = JSON.parse(await readFile(IN_PATH, 'utf8'));
  delete template.proof;
  delete template._note;
  delete template._variant_individual_learner;

  // The endorser signs under *their* DID — not the issuer's and not the
  // template placeholder. Rewrite issuer.id so the signed credential is
  // unambiguous about who is making the claim.
  if (!template.issuer || typeof template.issuer !== 'object') template.issuer = {};
  template.issuer.id = DID;

  // Give the signed artifact a stable URL matching where it's written.
  const relOut = path.relative(path.join(ROOT, 'credential'), OUT_PATH).replace(/\\/g, '/');
  template.id = `https://teachplay.dev/credential/${relOut}`;
  if (!template.validFrom) template.validFrom = new Date().toISOString();

  const keyPair = await loadKey();
  const suite = new DataIntegrityProof({
    signer: keyPair.signer(),
    cryptosuite: eddsaRdfc2022,
  });
  const signed = await vc.issue({ credential: template, suite, documentLoader });

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(signed, null, 2) + '\n');

  console.log('✓ Signed endorsement');
  console.log(`  endorser → ${DID}`);
  console.log(`  subject  → ${signed.credentialSubject?.id || '(none)'}`);
  console.log(`  input    → ${path.relative(ROOT, IN_PATH)}`);
  console.log(`  output   → ${path.relative(ROOT, OUT_PATH)}`);
  console.log(`  vm       → ${signed.proof.verificationMethod}`);
  console.log(`  suite    → ${signed.proof.cryptosuite}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
