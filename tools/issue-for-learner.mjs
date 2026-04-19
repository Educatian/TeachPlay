#!/usr/bin/env node
/**
 * Issue a signed OBv3 / W3C VC 2.0 credential for a single learner.
 *
 * Loads credential/assertion-example-v3.unsigned.json as a template, rewrites
 * the learner-specific fields, and signs with the teachplay.dev issuer key.
 *
 * Usage:
 *   node tools/issue-for-learner.mjs --id <learner-id> \
 *     [--email <addr>] [--name "Display Name"] \
 *     [--cohort 2026-spring] [--valid-from 2026-05-02] \
 *     [--out credential/assertions/<id>.json]
 *
 * Example:
 *   node tools/issue-for-learner.mjs --id 7f3c1e9a --email a@ua.edu --name "Ada L."
 *
 * The --id is the stable per-learner slug that appears in:
 *   - the assertion URL  (https://teachplay.dev/credential/assertions-v3/<id>.json)
 *   - the evidence paths (cohort/<cohort>/portfolios/<id>/...)
 *   - the output file    (credential/assertions/<id>.json by default)
 *
 * identityHash is computed as sha256("<salt><lowercased-email>") and the
 * salt is the cohort id, matching the handbook's stated identity contract.
 */

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';
import { cryptosuite as eddsaRdfc2022 } from '@digitalbazaar/eddsa-rdfc-2022-cryptosuite';
import { DataIntegrityProof } from '@digitalbazaar/data-integrity';
import * as vc from '@digitalbazaar/vc';
import jsonld from 'jsonld';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const KEY_PATH = path.join(ROOT, 'tools', 'keys', 'issuer-ed25519.private.json');
const TEMPLATE_PATH = path.join(ROOT, 'credential', 'assertion-example-v3.unsigned.json');
const REGISTRY_PATH = path.join(ROOT, 'credential', 'status-list-registry.json');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) { args[key] = true; }
    else { args[key] = next; i++; }
  }
  return args;
}

function usage(msg) {
  if (msg) console.error('✗ ' + msg);
  console.error('Usage: node tools/issue-for-learner.mjs --id <learner-id> [--email <addr>] [--name "Display Name"] [--cohort <slug>] [--valid-from <ISO>] [--out <path>]');
  process.exit(1);
}

const args = parseArgs(process.argv);
if (!args.id) usage('--id is required');
if (!/^[a-zA-Z0-9_-]{2,64}$/.test(args.id)) usage('--id must be 2–64 chars of [a-zA-Z0-9_-]');

const cohort = args.cohort || '2026-spring';
const validFrom = args['valid-from'] || new Date().toISOString();
const outPath = args.out
  ? path.resolve(args.out)
  : path.join(ROOT, 'credential', 'assertions', `${args.id}.json`);

function sha256(s) {
  return 'sha256$' + crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

async function fileExists(p) {
  try { await access(p, constants.F_OK); return true; } catch { return false; }
}

// Allocate or look up an index on the per-cohort status list. Returns null
// if the status-list subsystem isn't wired yet (so issuance still works
// without it). Passing --no-status skips allocation entirely.
async function allocateStatusIndex(learnerId, listSlug) {
  if (args['no-status']) return null;
  if (!(await fileExists(REGISTRY_PATH))) {
    console.warn(`  (!) status-list registry not found; skipping credentialStatus. Run 'node tools/status-list.mjs init --list ${listSlug}' first, or pass --no-status.`);
    return null;
  }
  const registry = JSON.parse(await readFile(REGISTRY_PATH, 'utf8'));
  const rec = registry.lists[listSlug];
  if (!rec) {
    console.warn(`  (!) status list '${listSlug}' not initialized; skipping credentialStatus.`);
    return null;
  }
  if (rec.entries[learnerId] != null) return rec.entries[learnerId];
  if (rec.next >= rec.size) throw new Error(`Status list '${listSlug}' is full (${rec.size} indices used).`);
  const index = rec.next;
  rec.entries[learnerId] = index;
  rec.next = index + 1;
  await writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2) + '\n');
  return index;
}

function customize(template, statusIndex) {
  const c = JSON.parse(JSON.stringify(template));
  c.id = `https://teachplay.dev/credential/assertions-v3/${args.id}.json`;
  c.validFrom = validFrom;
  delete c.proof;
  delete c._proof_note;

  if (statusIndex != null) {
    const listUrl = `https://teachplay.dev/credential/status-list-${cohort}.json`;
    c.credentialStatus = {
      id: `${listUrl}#${statusIndex}`,
      type: 'BitstringStatusListEntry',
      statusPurpose: 'revocation',
      statusListIndex: String(statusIndex),
      statusListCredential: listUrl,
    };
  }

  const subj = c.credentialSubject;
  subj.id = `urn:uuid:${args.id}`;

  if (args.name) subj.name = args.name;

  if (args.email) {
    const normalized = String(args.email).trim().toLowerCase();
    subj.identifier = [{
      type: 'IdentityObject',
      identityHash: sha256(cohort + normalized),
      identityType: 'emailAddress',
      hashed: true,
      salt: cohort,
    }];
  } else {
    delete subj.identifier;
  }

  // Rewrite evidence URLs from the scaffold learner-0001 slug to this learner + cohort.
  if (Array.isArray(c.evidence)) {
    for (const ev of c.evidence) {
      if (ev.id && typeof ev.id === 'string') {
        ev.id = ev.id
          .replace(/\/cohort\/[^/]+\//, `/cohort/${cohort}/`)
          .replace(/\/portfolios\/[^/]+\//, `/portfolios/${args.id}/`);
      }
    }
  }

  return c;
}

const nodeDocumentLoader = jsonld.documentLoaders.node();
const documentLoader = async (url) => nodeDocumentLoader(url);

async function loadKey() {
  const raw = JSON.parse(await readFile(KEY_PATH, 'utf8'));
  return Ed25519Multikey.from(raw);
}

async function main() {
  const template = JSON.parse(await readFile(TEMPLATE_PATH, 'utf8'));
  const statusIndex = await allocateStatusIndex(args.id, cohort);
  const credential = customize(template, statusIndex);

  const keyPair = await loadKey();
  const suite = new DataIntegrityProof({
    signer: keyPair.signer(),
    cryptosuite: eddsaRdfc2022,
  });

  const signed = await vc.issue({ credential, suite, documentLoader });

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(signed, null, 2) + '\n');

  console.log('✓ Issued learner credential');
  console.log(`  learner → ${args.id}${args.email ? ` (email hashed with salt=${cohort})` : ''}`);
  console.log(`  cohort  → ${cohort}`);
  console.log(`  url     → ${signed.id}`);
  console.log(`  output  → ${path.relative(ROOT, outPath)}`);
  console.log(`  vm      → ${signed.proof.verificationMethod}`);
  console.log(`  suite   → ${signed.proof.cryptosuite}`);
  if (statusIndex != null) {
    console.log(`  status  → index ${statusIndex} on status-list-${cohort}`);
  } else {
    console.log(`  status  → (not set; no registry or --no-status)`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
