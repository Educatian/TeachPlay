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

/**
 * Program-level Evidence entry stamped into every issued credential.
 *
 * OB 3.0 Final defines `evidence` (via the VC 2.0 base context) and the
 * Evidence class (OB v3 context) — both are present in the vendored contexts
 * (src/lib/contexts/ob-v3p0.js + @digitalbazaar/credentials-context), so the
 * eddsa-rdfc-2022 canonicalization stays deterministic and offline. The
 * narrative documents WHAT was verified, not who the learner is: no PII beyond
 * what the credential already carries (hashed email + subject id).
 */
const PROGRAM_EVIDENCE = {
  type: ['Evidence'],
  name: 'Program completion evidence — reviewed portfolio',
  narrative:
    'The learner submitted a five-deliverable evidence portfolio (D1 Design ' +
    'Problem Statement, D2 Objective × Mechanic Crosswalk, D3 Paper Prototype ' +
    '+ Facilitator Guide, D4 Playtest Report, D5 Implementation Spec) and was ' +
    'scored at Proficient or above on all 25 criteria of the non-compensatory ' +
    'rubric by an instructor. The learner completed all 12 sessions of the ' +
    'program and the post-program survey.',
  genre: 'Reviewed portfolio + completion record',
  audience: 'Employers, registrars, and credential verifiers',
};

/**
 * External-framework alignment stamped onto the embedded Achievement.
 *
 * Mirrors the Alignment shape already published in
 * credential/badge-class-v3.json (type/targetName/targetUrl/targetDescription/
 * targetFramework/targetType — all defined in the vendored OB v3 context).
 * Framework-aligned metadata is what makes the credential legible to
 * third-party consumers (Ward et al., 2024, IEEE Trans. on Education).
 */
const ACHIEVEMENT_ALIGNMENT = [
  {
    type: ['Alignment'],
    targetName: 'UNESCO AI Competency Framework for Teachers',
    targetUrl: 'https://doi.org/10.54675/ZJTE2084',
    targetDescription:
      'Maps primarily to the AI pedagogy, Ethics of AI, and AI foundations ' +
      'and applications competency dimensions: designing AI-enhanced learning ' +
      'activities, auditing them for ethical risk and excluded populations, ' +
      'and applying GenAI tools with documented, accountable use.',
    targetFramework: 'UNESCO AI Competency Framework for Teachers (2024)',
    targetType: 'ceasn:Competency',
  },
  {
    type: ['Alignment'],
    targetName: 'TeachPlay Learning Outcome Alignment Matrix (LO ↔ Session ↔ Deliverable ↔ Rubric ↔ Standards)',
    targetUrl: 'https://teachplay.dev/alignment.html',
    targetDescription:
      'The program’s constructive-alignment matrix: every learning ' +
      'outcome traces to the session activity that produces evidence, the ' +
      'deliverable it feeds, the rubric criterion it is scored on, and the ' +
      'external standards it advances.',
    targetFramework: 'TeachPlay — AI-enhanced Educational Game Design',
    targetType: 'CFRubric',
  },
];

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

  // OB 3.0 evidence + alignment embed (see the constants above). Both are
  // idempotent against template drift: the program-level Evidence entry is
  // appended only if the template doesn't already carry one, and alignment
  // is only set when the template's Achievement has none of its own.
  if (!Array.isArray(c.evidence)) c.evidence = [];
  if (!c.evidence.some(ev => ev && ev.name === PROGRAM_EVIDENCE.name)) {
    c.evidence.push(JSON.parse(JSON.stringify(PROGRAM_EVIDENCE)));
  }
  if (subj.achievement && !Array.isArray(subj.achievement.alignment)) {
    subj.achievement.alignment = JSON.parse(JSON.stringify(ACHIEVEMENT_ALIGNMENT));
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
    statusIndex = await allocateIndex(env, cohort, DEFAULT_BITSTRING_SIZE, {
      credential_id: `https://teachplay.dev/credential/assertions-v3/${id}.json`,
      learner_id: id,
    });
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
