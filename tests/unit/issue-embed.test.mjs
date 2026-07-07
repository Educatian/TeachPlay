// Coverage for the OB 3.0 evidence + alignment embed at issuance (T1).
//
// issueCredential() must stamp (a) a program-level Evidence entry (portfolio
// submitted, 25/25 Proficient, 12 sessions, post-program survey — no PII) and
// (b) UNESCO AI-CFT + TeachPlay-matrix Alignment entries on the embedded
// Achievement — AND the credential must still sign/verify under
// eddsa-rdfc-2022. Signing runs RDFC canonicalization against the vendored
// contexts, so this test is the proof that every added property is a defined
// term (an undefined term would either throw at issue time or fall outside
// the signature — the tamper test below rules out the latter).
//
// Uses an ephemeral Ed25519 keypair (no production key material) and a local
// documentLoader that mirrors src/api/verify-credential.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as Ed25519Multikey from '@digitalbazaar/ed25519-multikey';
import { cryptosuite as eddsaRdfc2022 } from '@digitalbazaar/eddsa-rdfc-2022-cryptosuite';
import { DataIntegrityProof } from '@digitalbazaar/data-integrity';
import * as vc from '@digitalbazaar/vc';
import { contexts as vcContexts } from '@digitalbazaar/credentials-context';
import obV3Context from '../../src/lib/contexts/ob-v3p0.js';
import { issueCredential } from '../../src/lib/issue.js';

const here = dirname(fileURLToPath(import.meta.url));
const template = JSON.parse(
  await readFile(join(here, '../../credential/assertion-example-v3.unsigned.json'), 'utf8')
);

// ── Ephemeral issuer key bound to the production controller DID ────────────
const CONTROLLER = 'did:web:teachplay.dev';
const keyPair = await Ed25519Multikey.generate({ controller: CONTROLLER });
const exported = await keyPair.export({ publicKey: true, secretKey: true });

const env = {
  ISSUER_PRIVATE_KEY_JSON: JSON.stringify(exported),
  ASSETS: {
    // issueCredential re-targets any same-origin URL at the unsigned template.
    fetch: async () => ({ ok: true, json: async () => structuredClone(template) }),
  },
};

// Same shape as the verifier's embedded-first loader, but resolving the
// ephemeral key instead of the production one.
const DID_DOC = {
  '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/multikey/v1'],
  id: CONTROLLER,
  verificationMethod: [{
    id: exported.id,
    type: 'Multikey',
    controller: CONTROLLER,
    publicKeyMultibase: exported.publicKeyMultibase,
  }],
  assertionMethod: [exported.id],
};

const embeddedContexts = new Map(vcContexts);
embeddedContexts.set('https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json', obV3Context);

const documentLoader = async (url) => {
  if (embeddedContexts.has(url)) {
    return { documentUrl: url, document: embeddedContexts.get(url), contextUrl: null };
  }
  if (url === CONTROLLER) {
    return { documentUrl: url, document: DID_DOC, contextUrl: null };
  }
  if (url.startsWith(CONTROLLER + '#')) {
    const vm = DID_DOC.verificationMethod.find(v => v.id === url);
    if (!vm) throw new Error(`Unknown verification method ${url}`);
    return {
      documentUrl: url,
      document: { '@context': 'https://w3id.org/security/multikey/v1', ...vm },
      contextUrl: null,
    };
  }
  throw new Error(`documentLoader: refusing to fetch external resource ${url}`);
};

async function verifySignature(credential) {
  const suite = new DataIntegrityProof({ cryptosuite: eddsaRdfc2022 });
  return vc.verifyCredential({
    credential: structuredClone(credential), suite, documentLoader,
    checkStatus: async () => ({ verified: true }),
  });
}

const payload = {
  id: 'unit-test-0001',
  cohort: '2026-spring',
  name: 'Unit Test Learner',
  email: 'unit-test@example.edu',
  validFrom: '2026-05-02T00:00:00Z',
  noStatus: true, // no D1/KV in this test — skip status-list allocation
};

const { signed } = await issueCredential(payload, env, 'https://teachplay.dev/api/issue');

test('issue: credential carries the program-level Evidence entry (no PII)', () => {
  assert.ok(Array.isArray(signed.evidence), 'evidence[] present');
  const prog = signed.evidence.find(e => e.name === 'Program completion evidence — reviewed portfolio');
  assert.ok(prog, 'program-level Evidence entry present');
  assert.deepEqual(prog.type, ['Evidence']);
  for (const claim of ['five-deliverable', '25 criteria', 'non-compensatory', '12 sessions', 'post-program survey']) {
    assert.match(prog.narrative, new RegExp(claim), `narrative documents: ${claim}`);
  }
  // No learner PII in the added entry beyond what the credential already carries.
  const blob = JSON.stringify(prog);
  assert.ok(!blob.includes('unit-test@example.edu'), 'no email in evidence');
  assert.ok(!blob.includes('Unit Test Learner'), 'no name in evidence');
});

test('issue: embedded Achievement carries UNESCO AI-CFT + LO-matrix alignment', () => {
  const alignment = signed.credentialSubject?.achievement?.alignment;
  assert.ok(Array.isArray(alignment) && alignment.length >= 2, 'alignment[] present');
  const unesco = alignment.find(a => a.targetUrl === 'https://doi.org/10.54675/ZJTE2084');
  assert.ok(unesco, 'UNESCO AI-CFT alignment present');
  assert.equal(unesco.targetName, 'UNESCO AI Competency Framework for Teachers');
  assert.match(unesco.targetDescription, /AI pedagogy/);
  assert.match(unesco.targetDescription, /Ethics of AI/);
  assert.match(unesco.targetDescription, /AI foundations/);
  const matrix = alignment.find(a => a.targetUrl === 'https://teachplay.dev/alignment.html');
  assert.ok(matrix, 'TeachPlay LO alignment-matrix alignment present');
  assert.deepEqual(matrix.type, ['Alignment']);
});

test('issue: credential with evidence+alignment still signs and verifies (eddsa-rdfc-2022)', async () => {
  const result = await verifySignature(signed);
  assert.equal(result.verified, true,
    `signature should verify — got: ${result.error?.errors?.[0]?.message || result.error?.message || 'ok'}`);
});

test('issue: alignment is INSIDE the signed payload (tampering it breaks the proof)', async () => {
  const tampered = structuredClone(signed);
  tampered.credentialSubject.achievement.alignment[0].targetName = 'Tampered Framework';
  const result = await verifySignature(tampered);
  assert.equal(result.verified, false, 'tampered alignment must invalidate the signature');
});

test('issue: evidence narrative is INSIDE the signed payload', async () => {
  const tampered = structuredClone(signed);
  const prog = tampered.evidence.find(e => e.name === 'Program completion evidence — reviewed portfolio');
  prog.narrative = 'Scored Emerging on everything.';
  const result = await verifySignature(tampered);
  assert.equal(result.verified, false, 'tampered evidence must invalidate the signature');
});
