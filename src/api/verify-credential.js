/**
 * POST /api/verify-credential — public credential verifier.
 *
 * Accepts a signed VC JSON body and runs three checks:
 *   1. Ed25519 DataIntegrityProof signature (eddsa-rdfc-2022)
 *   2. BitstringStatusList revocation (if credentialStatus present)
 *   3. validFrom / validUntil date window
 *
 * Returns { valid, checks: [{name, ok, detail}], credential: {…summary} }
 */
import { cryptosuite as eddsaRdfc2022 } from '@digitalbazaar/eddsa-rdfc-2022-cryptosuite';
import { DataIntegrityProof } from '@digitalbazaar/data-integrity';
import * as vc from '@digitalbazaar/vc';
import { contexts as vcContexts } from '@digitalbazaar/credentials-context';
import { decodeBitstring, getBit } from '../lib/status-list.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

const DID_DOC = {
  '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/multikey/v1'],
  id: 'did:web:teachplay.dev',
  verificationMethod: [{
    id: 'did:web:teachplay.dev#z6MkqQhD7h6TgwSN2mFEHpnr3irB1ygY7bs7vT2tgayBzDsQ',
    type: 'Multikey',
    controller: 'did:web:teachplay.dev',
    publicKeyMultibase: 'z6MkqQhD7h6TgwSN2mFEHpnr3irB1ygY7bs7vT2tgayBzDsQ',
  }],
  assertionMethod: ['did:web:teachplay.dev#z6MkqQhD7h6TgwSN2mFEHpnr3irB1ygY7bs7vT2tgayBzDsQ'],
  authentication: ['did:web:teachplay.dev#z6MkqQhD7h6TgwSN2mFEHpnr3irB1ygY7bs7vT2tgayBzDsQ'],
};

const embeddedContexts = new Map(vcContexts);

const documentLoader = async (url) => {
  if (embeddedContexts.has(url)) {
    return { documentUrl: url, document: embeddedContexts.get(url), contextUrl: null };
  }
  if (url === 'did:web:teachplay.dev' || url.startsWith('did:web:teachplay.dev#')) {
    return { documentUrl: url, document: DID_DOC, contextUrl: null };
  }
  const res = await fetch(url, { headers: { accept: 'application/ld+json, application/json' } });
  if (!res.ok) throw new Error(`documentLoader: ${url} → HTTP ${res.status}`);
  return { documentUrl: url, document: await res.json(), contextUrl: null };
};

async function checkStatus(credential) {
  const cs = credential.credentialStatus;
  if (!cs) return { checked: false, reason: 'No credentialStatus field' };
  const listUrl = cs.statusListCredential;
  const index = parseInt(cs.statusListIndex, 10);
  if (!listUrl || !Number.isFinite(index)) {
    return { checked: false, reason: 'Malformed credentialStatus' };
  }
  try {
    const res = await fetch(listUrl, { headers: { accept: 'application/json' } });
    if (!res.ok) return { checked: false, reason: `Status list HTTP ${res.status}` };
    const listVC = await res.json();
    const encoded = listVC.credentialSubject?.encodedList;
    if (!encoded) return { checked: false, reason: 'No encodedList in status list' };
    const bits = await decodeBitstring(encoded);
    const bit = getBit(bits, index);
    return { checked: true, revoked: bit === 1, index };
  } catch (e) {
    return { checked: false, reason: e.message };
  }
}

export async function handleVerifyCredential(request, env) {
  if (request.method !== 'POST') return json({ error: 'POST required' }, 405);

  let credential;
  try { credential = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  if (!credential || typeof credential !== 'object') return json({ error: 'Body must be a JSON object' }, 400);
  if (!credential.proof) return json({ error: 'No proof found — is this a signed credential?' }, 400);

  const checks = [];

  // 1. Signature
  const sigCheck = { name: 'signature', ok: false, detail: '' };
  try {
    const suite = new DataIntegrityProof({ cryptosuite: eddsaRdfc2022 });
    const result = await vc.verify({ credential: structuredClone(credential), suite, documentLoader });
    sigCheck.ok = result.verified;
    sigCheck.detail = result.verified
      ? 'Ed25519 signature valid (eddsa-rdfc-2022)'
      : (result.error?.errors?.[0]?.message || result.error?.message || 'Signature invalid');
  } catch (e) {
    sigCheck.detail = e.message;
  }
  checks.push(sigCheck);

  // 2. Revocation status
  const statusResult = await checkStatus(credential);
  let statusDetail, statusOk;
  if (!statusResult.checked) {
    statusOk = true;
    statusDetail = statusResult.reason;
  } else if (statusResult.revoked) {
    statusOk = false;
    statusDetail = `Revoked (status list index ${statusResult.index})`;
  } else {
    statusOk = true;
    statusDetail = `Not revoked (index ${statusResult.index})`;
  }
  checks.push({ name: 'revocation', ok: statusOk, detail: statusDetail });

  // 3. Validity window
  const now = new Date();
  const validFrom  = credential.validFrom  ? new Date(credential.validFrom)  : null;
  const validUntil = credential.validUntil ? new Date(credential.validUntil) : null;
  let dateOk = true, dateDetail = '';
  if (validFrom && validFrom > now) {
    dateOk = false;
    dateDetail = `Not yet valid — validFrom ${validFrom.toISOString().slice(0, 10)}`;
  } else if (validUntil && validUntil < now) {
    dateOk = false;
    dateDetail = `Expired — validUntil ${validUntil.toISOString().slice(0, 10)}`;
  } else {
    dateDetail = validFrom
      ? `Valid since ${validFrom.toISOString().slice(0, 10)}`
      : 'No date restriction';
  }
  checks.push({ name: 'validity', ok: dateOk, detail: dateDetail });

  const issuer = credential.issuer;
  return json({
    valid: checks.every(c => c.ok),
    checks,
    credential: {
      id: credential.id || null,
      issuer: typeof issuer === 'string' ? issuer : (issuer?.name || issuer?.id || null),
      name: credential.credentialSubject?.name || null,
      achievement: credential.credentialSubject?.achievement?.name || null,
      validFrom: credential.validFrom || null,
    },
  });
}
