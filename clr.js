// clr.js — CLR 2.0 (Comprehensive Learner Record) export adapter.
//
// Reads the xAPI queue written by xapi.js plus the locally-held rubric/ticket
// state and assembles a 1EdTech CLR 2.0 ClrCredential for a single learner.
// The output is a Verifiable Credential whose credentialSubject is a
// ClrSubject containing all of the learner's Achievements (one per deliverable)
// plus every associated Result, Evidence, and Assertion of the underlying
// xAPI statements.
//
// CLR captures more than a badge does: every LO touch, every rubric criterion
// score, every reflection — so an external registrar or employer can reason
// about the learner's record at granularity, not just pass/fail. See
// https://www.imsglobal.org/spec/clr/v2p0.
//
// Depends on: xapi.js (window.xapi.readQueue), optionally nothing else.
// Exposes: window.clr = { buildCredential, downloadNdjson, downloadJson }

(function () {
  if (!window.xapi) {
    console.warn('[clr] xapi.js must be loaded first');
    return;
  }

  const BASE_IRI = 'https://educatian.github.io/TeachPlay';
  const ISSUER = {
    id: `${BASE_IRI}/credential/issuer-v3.json`,
    type: ['Profile'],
    name: 'The University of Alabama — College of Education',
    url: 'https://education.ua.edu/',
  };

  // ── Helpers ────────────────────────────────────────────────
  function groupBy(arr, keyFn) {
    const out = new Map();
    for (const x of arr) {
      const k = keyFn(x);
      if (!out.has(k)) out.set(k, []);
      out.get(k).push(x);
    }
    return out;
  }

  function statementsForActor(actorName) {
    return window.xapi.readQueue().filter(s => s.actor && s.actor.account && s.actor.account.name === actorName);
  }

  function deriveResults(statements) {
    // Pass-through from xAPI result extensions into CLR Result shape.
    const results = [];
    for (const s of statements) {
      if (!s.result) continue;
      const r = {
        type: 'Result',
        achievedLevel: s.result.achievedLevel || null,
        resultDescription: s.object && s.object.definition && s.object.definition.name && s.object.definition.name['en-US'],
        value: s.result.score ? String(s.result.score.raw ?? s.result.score.scaled) : null,
      };
      if (s.result.completion === true) r.achievedLevel = r.achievedLevel || 'Completed';
      results.push(r);
    }
    return results;
  }

  function achievementsForDeliverables(statements) {
    // One Achievement per deliverable the learner has evidence for.
    const byDeliv = groupBy(
      statements.filter(s => s.object && s.object.id && s.object.id.includes('/deliverable/')),
      s => s.object.id.match(/deliverable\/([^/?#]+)/)[1]
    );
    const achievements = [];
    for (const [delivId, stmts] of byDeliv) {
      achievements.push({
        type: ['Achievement'],
        id: `${BASE_IRI}/credential/achievements/${delivId}`,
        name: `Deliverable ${delivId.toUpperCase()}`,
        achievementType: 'Assessment',
        criteria: {
          id: `${BASE_IRI}/rubrics.html#${delivId.toLowerCase()}`,
          narrative: `Proficient on all rubric criteria for deliverable ${delivId.toUpperCase()}`,
        },
        _xapi_statement_count: stmts.length,
      });
    }
    return achievements;
  }

  // ── Public: buildCredential(actorName) ─────────────────────
  function buildCredential(actorName) {
    actorName = actorName || window.xapi.getActorId();
    const statements = statementsForActor(actorName);
    const cohort = (statements[0] && statements[0].context &&
      statements[0].context.extensions &&
      statements[0].context.extensions[`${BASE_IRI}/ext/cohort`]) || window.xapi.getCohort();

    const achievements = achievementsForDeliverables(statements);
    const results = deriveResults(statements);

    // CLR ClrCredential shape (simplified to the fields most consumers use).
    return {
      '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/clr/v2p0/context-2.0.1.json',
      ],
      id: `${BASE_IRI}/credential/clr/${actorName}.json`,
      type: ['VerifiableCredential', 'ClrCredential'],
      name: 'Comprehensive Learner Record — AI-enhanced Educational Game Design',
      issuer: ISSUER,
      validFrom: new Date().toISOString(),
      credentialSubject: {
        type: ['ClrSubject'],
        id: `did:example:learner-${actorName}`,
        identifier: [{
          type: 'IdentifierEntry',
          identityType: 'pseudonymousId',
          identityHash: actorName,
          hashed: false,
        }],
        association: [{
          type: 'Association',
          associationType: 'sourcedFrom',
          sourceId: cohort,
        }],
        achievement: achievements,
        result: results,
        // The full xAPI statement queue carried as an extension so a consumer
        // that wants to re-derive the record from events can do so without
        // asking us for it.
        _xapi_statements: statements,
      },
      _note: 'CLR ClrCredential expressed as a W3C Verifiable Credential. Sign the canonicalized form with an Ed25519 key bound to the issuer DID before presenting externally. This export is unsigned by design (reference handbook).',
    };
  }

  // ── Exporters ──────────────────────────────────────────────
  function downloadJson(actorName) {
    const clr = buildCredential(actorName);
    const blob = new Blob([JSON.stringify(clr, null, 2)], { type: 'application/ld+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clr-${clr.credentialSubject.identifier[0].identityHash}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadNdjson() {
    // One CLR per distinct actor in the queue — useful for a cohort-wide export.
    const q = window.xapi.readQueue();
    const actors = new Set(q.map(s => s.actor && s.actor.account && s.actor.account.name).filter(Boolean));
    const lines = [...actors].map(a => JSON.stringify(buildCredential(a))).join('\n');
    const blob = new Blob([lines], { type: 'application/x-ndjson' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clr-cohort-${window.xapi.getCohort()}.ndjson`;
    a.click();
    URL.revokeObjectURL(url);
  }

  window.clr = { buildCredential, downloadJson, downloadNdjson };
})();
