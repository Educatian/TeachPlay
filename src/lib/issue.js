/**
 * Shared per-learner credential builder for the teachplay Worker.
 *
 * Both /api/issue (admin, shared-secret auth) and /api/claim (learner,
 * one-time code auth) need to produce the same artifact from the same
 * inputs — a signed OpenBadgeCredential VC with an allocated
 * credentialStatus entry. Keeping the customize + status-alloc + sign
 * pipeline in one place means "what does teachplay issue?" has a
 * single implementation no matter which authn gate triggered it.
 */
import { signCredential } from './sign.js';
import {
  allocateIndex,
  buildStatusEntry,
  DEFAULT_BITSTRING_SIZE,
} from './status-list.js';

const TEMPLATE_PATH = '/credential/assertion-example-v3.unsigned.json';

export const ID_PATTERN = /^[a-zA-Z0-9_-]{2,64}$/;
export const COHORT_PATTERN = /^[a-z0-9-]{2,32}$/;

export async function sha256Hex(s) {
  const bytes = new TextEncoder().encode(s);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function fetchTemplate(originUrl, env) {
  const u = new URL(originUrl);
  u.pathname = TEMPLATE_PATH;
  u.search = '';
  const res = await env.ASSETS.fetch(new Request(u.toString()));
  if (!res.ok) throw new Error(`Template fetch (${TEMPLATE_PATH}) → HTTP ${res.status}`);
  return res.json();
}

function customize(template, { id, name, cohort, validFrom, statusEntry }, identityHash) {
  const c = JSON.parse(JSON.stringify(template));
  c.id = `https://teachplay.dev/credential/assertions-v3/${id}.json`;
  c.validFrom = validFrom;
  delete c.proof;
  delete c._proof_note;

  if (statusEntry) c.credentialStatus = statusEntry;
  else delete c.credentialStatus;

  const subj = c.credentialSubject;
  subj.id = `urn:uuid:${id}`;
  if (name) subj.name = name;

  if (identityHash) {
    subj.identifier = [{
      type: 'IdentityObject',
      identityHash: 'sha256$' + identityHash,
      identityType: 'emailAddress',
      hashed: true,
      salt: cohort,
    }];
  } else {
    delete subj.identifier;
  }

  if (Array.isArray(c.evidence)) {
    for (const ev of c.evidence) {
      if (ev.id && typeof ev.id === 'string') {
        ev.id = ev.id
          .replace(/\/cohort\/[^/]+\//, `/cohort/${cohort}/`)
          .replace(/\/portfolios\/[^/]+\//, `/portfolios/${id}/`);
      }
    }
  }

  return c;
}

/**
 * Validate and normalize a learner payload. Returns {ok, value} or {ok:false, error}.
 * Shared by /api/issue and /api/claim-code so both reject bad input with the
 * same shape before any KV or signing work runs.
 */
export function normalizeLearnerPayload(body) {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Body must be a JSON object' };
  const id = body.id;
  if (!id || !ID_PATTERN.test(id)) {
    return { ok: false, error: '`id` is required and must match [a-zA-Z0-9_-]{2,64}' };
  }
  const cohort = body.cohort || '2026-spring';
  if (!COHORT_PATTERN.test(cohort)) {
    return { ok: false, error: '`cohort` must match [a-z0-9-]{2,32}' };
  }
  const name = body.name ? String(body.name) : null;
  const email = body.email ? String(body.email).trim().toLowerCase() : null;
  const validFrom = body.validFrom || null; // resolve lazily at issuance time
  const noStatus = !!body.noStatus;
  return { ok: true, value: { id, cohort, name, email, validFrom, noStatus } };
}

/**
 * Produce a signed VC from a normalized learner payload. Allocates a
 * status-list index unless `noStatus` is set. `originUrl` is any URL
 * in the same Worker origin (used to re-target env.ASSETS.fetch at
 * the unsigned template).
 */
export async function issueCredential(payload, env, originUrl) {
  const { id, cohort, name, email, validFrom: vfIn, noStatus } = payload;
  const validFrom = vfIn || new Date().toISOString();

  let statusIndex = null;
  let statusEntry = null;
  if (!noStatus) {
    statusIndex = await allocateIndex(env, cohort, DEFAULT_BITSTRING_SIZE);
    statusEntry = buildStatusEntry(cohort, statusIndex);
  }

  const template = await fetchTemplate(originUrl, env);
  const identityHash = email ? await sha256Hex(cohort + email) : null;
  const credential = customize(
    template,
    { id, name, cohort, validFrom, statusEntry },
    identityHash,
  );
  const signed = await signCredential(credential, env);
  return { signed, statusIndex };
}
