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
import { fileURLToPath } from 'node:url';

import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';
import { cryptosuite as eddsaRdfc2022 } from '@digitalbazaar/eddsa-rdfc-2022-cryptosuite';
import { DataIntegrityProof } from '@digitalbazaar/data-integrity';
import * as vc from '@digitalbazaar/vc';
import jsonld from 'jsonld';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_KEY_PATH = path.join(ROOT, 'tools', 'keys', 'issuer-ed25519.public.json');

const inputArg = process.argv[2];
if (!inputArg) {
  console.error('Usage: node tools/verify-vc.mjs <signed.json>');
  process.exit(1);
}

const publicKey = await Ed25519Multikey.from(
  JSON.parse(await readFile(PUBLIC_KEY_PATH, 'utf8'))
);
const suite = new DataIntegrityProof({ cryptosuite: eddsaRdfc2022 });

// Custom document loader: short-circuit did:web and the verification method
// lookup against our locally-known public key. This mirrors what a real
// verifier does after fetching https://teachplay.dev/.well-known/did.json.
const nodeLoader = jsonld.documentLoaders.node();
const didDoc = JSON.parse(await readFile(path.join(ROOT, '.well-known', 'did.json'), 'utf8'));
const vmExport = await publicKey.export({ publicKey: true, includeContext: true });

const documentLoader = async (url) => {
  if (url === publicKey.controller) {
    return { documentUrl: url, document: didDoc, contextUrl: null };
  }
  if (url === publicKey.id) {
    return { documentUrl: url, document: vmExport, contextUrl: null };
  }
  return nodeLoader(url);
};

const credential = JSON.parse(await readFile(inputArg, 'utf8'));

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
