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
import obV3Context from '../lib/contexts/ob-v3p0.js';
import { decodeBitstring, getBit } from '../lib/status-list.js';
import { getClientIp, rateLimit } from '../lib/security.js';

// OpenBadges v3 context URL teachplay credentials embed in their @context.
const OB_V3_URL = 'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json';

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

// Only our own origin may be fetched for a status list. Without this, the
// attacker-supplied `statusListCredential` URL turns the verifier into an
// SSRF egress to arbitrary hosts.
function isAllowedFetchUrl(u) {
  try {
    const url = new URL(u);
    return url.protocol === 'https:' &&
      (url.hostname === 'teachplay.dev' || url.hostname === 'www.teachplay.dev');
  } catch { return false; }
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
// Vendored so verification resolves the OB v3 context without a network fetch.
embeddedContexts.set(OB_V3_URL, obV3Context);

const documentLoader = async (url) => {
  if (embeddedContexts.has(url)) {
    return { documentUrl: url, document: embeddedContexts.get(url), contextUrl: null };
  }
  if (url === 'did:web:teachplay.dev') {
    return { documentUrl: url, document: DID_DOC, contextUrl: null };
  }
  // A fragment URL resolves to the single verification method (with its
  // publicKeyMultibase), not the whole DID document — the cryptosuite needs
  // the key shape, not the profile.
  if (url.startsWith('did:web:teachplay.dev#')) {
    const vm = (DID_DOC.verificationMethod || []).find(v => v.id === url);
    if (!vm) throw new Error(`Unknown verification method ${url}`);
    return {
      documentUrl: url,
      document: {
        '@context': 'https://w3id.org/security/multikey/v1',
        id: vm.id, type: vm.type, controller: vm.controller,
        publicKeyMultibase: vm.publicKeyMultibase,
      },
      contextUrl: null,
    };
  }
  // All teachplay-issued credentials embed their @context locally and resolve
  // their issuer via the did:web above. Refuse to dereference any other URL so
  // a crafted credential can't drive the Worker to fetch arbitrary hosts.
  throw new Error(`documentLoader: refusing to fetch external resource ${url}`);
};

async function checkStatus(credential) {
  const cs = credential.credentialStatus;
  if (!cs) return { checked: false, reason: 'No credentialStatus field' };
  const listUrl = cs.statusListCredential;
  const index = parseInt(cs.statusListIndex, 10);
  if (!listUrl || !Number.isFinite(index)) {
    return { checked: false, reason: 'Malformed credentialStatus' };
  }
  if (!isAllowedFetchUrl(listUrl)) {
    return { checked: false, reason: 'Status list URL is not on an allowed host' };
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

  // Each call runs Ed25519 verify + RDFC canonicalization — cap per IP so it
  // can't be used for unauthenticated CPU amplification.
  const limit = await rateLimit(env, 'verify', getClientIp(request), 30, 60);
  if (!limit.ok) return json({ error: 'Too many requests' }, 429);

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
    // verifyCredential (NOT verify — that path is for Verifiable Presentations and
    // throws "a presentation property is required"). Revocation + dates are checked
    // separately below, so stub checkStatus to satisfy the credentialStatus-present
    // requirement; this also runs CredentialIssuancePurpose (issuer↔VM binding).
    const result = await vc.verifyCredential({
      credential: structuredClone(credential), suite, documentLoader,
      checkStatus: async () => ({ verified: true }),
    });
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
