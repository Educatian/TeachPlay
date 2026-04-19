// xapi.js — learning-analytics event emitter for the AI-enhanced Educational Game Design handbook.
//
// Emits lightweight xAPI-1.0.3 statements on learner actions (checklist toggles,
// exit-ticket edits, session completions, rubric sign-offs). Statements are written
// to localStorage as a durable queue and — if window.XAPI_CONFIG.endpoint is set —
// POSTed to a configured LRS in the background. The queue is the source of truth
// consumed by analytics.html; the LRS is optional delivery.
//
// This file intentionally depends on nothing and is safe to load before shell.js.

(function () {
  const QUEUE_KEY = 'hb:xapi:queue';
  const ACTOR_KEY = 'hb:xapi:actor';
  const COHORT_KEY = 'hb:xapi:cohort';

  const CONFIG = Object.assign({
    endpoint: null,             // e.g. "https://lrs.example.edu/xapi/statements"
    authHeader: null,           // "Basic ..." or "Bearer ..."
    flushIntervalMs: 15000,     // 15s batch flush to LRS
    platform: 'eduu-game-design-handbook',
    version: '2.0.0',
  }, window.XAPI_CONFIG || {});

  // ── Identity (pseudonymous) ─────────────────────────────────
  function uuid() {
    return (crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        });
  }
  function getActor() {
    let id = localStorage.getItem(ACTOR_KEY);
    if (!id) { id = uuid(); localStorage.setItem(ACTOR_KEY, id); }
    const cohort = localStorage.getItem(COHORT_KEY) || 'unassigned';
    return {
      objectType: 'Agent',
      account: {
        homePage: 'https://teachplay.dev/',
        name: id,
      },
      // Extension-style cohort tag carried on each statement via context.
      _cohort: cohort,
    };
  }
  function setCohort(cohortId) {
    localStorage.setItem(COHORT_KEY, cohortId);
  }

  // ── Verb registry (ADL + custom) ────────────────────────────
  const V = {
    completed:   { id: 'http://adlnet.gov/expapi/verbs/completed',   display: { 'en-US': 'completed' } },
    experienced: { id: 'http://adlnet.gov/expapi/verbs/experienced', display: { 'en-US': 'experienced' } },
    attempted:   { id: 'http://adlnet.gov/expapi/verbs/attempted',   display: { 'en-US': 'attempted' } },
    answered:    { id: 'http://adlnet.gov/expapi/verbs/answered',    display: { 'en-US': 'answered' } },
    responded:   { id: 'http://adlnet.gov/expapi/verbs/responded',   display: { 'en-US': 'responded' } },
    submitted:   { id: 'http://activitystrea.ms/submit',             display: { 'en-US': 'submitted' } },
    scored:      { id: 'http://id.tincanapi.com/verb/scored',        display: { 'en-US': 'scored' } },
    reviewed:    { id: 'http://id.tincanapi.com/verb/reviewed',      display: { 'en-US': 'reviewed' } },
    verified:    { id: 'https://teachplay.dev/verbs/verified',       display: { 'en-US': 'verified' } },
  };

  // ── Activity object builder ─────────────────────────────────
  const BASE_IRI = 'https://teachplay.dev/activities';
  function obj(kind, id, name) {
    return {
      id: `${BASE_IRI}/${kind}/${id}`,
      definition: {
        name: { 'en-US': name || `${kind}:${id}` },
        type: `http://adlnet.gov/expapi/activities/${kind}`,
      },
    };
  }

  // ── Queue I/O ───────────────────────────────────────────────
  function readQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
    catch { return []; }
  }
  function writeQueue(q) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); }
    catch (e) { console.warn('[xapi] queue write failed', e); }
  }

  // ── Emit ────────────────────────────────────────────────────
  function emit(verbKey, activity, extras) {
    extras = extras || {};
    const verb = V[verbKey];
    if (!verb) { console.warn('[xapi] unknown verb', verbKey); return null; }

    const actor = getActor();
    const stmt = {
      id: uuid(),
      actor: { objectType: actor.objectType, account: actor.account },
      verb,
      object: activity,
      timestamp: new Date().toISOString(),
      context: {
        platform: CONFIG.platform,
        language: 'en-US',
        extensions: Object.assign(
          { 'https://teachplay.dev/ext/cohort': actor._cohort,
            'https://teachplay.dev/ext/version': CONFIG.version },
          extras.contextExt || {}
        ),
        contextActivities: extras.parent ? { parent: [extras.parent] } : undefined,
      },
    };
    if (extras.result) stmt.result = extras.result;

    const q = readQueue();
    q.push(stmt);
    writeQueue(q);
    return stmt;
  }

  // ── Convenience emitters ────────────────────────────────────
  function session(n) {
    return obj('session', `s${n}`, `Session ${String(n).padStart(2,'0')}`);
  }
  function deliverable(d) {
    return obj('deliverable', d, `Deliverable ${d}`);
  }
  function checklistItem(n, id) {
    return obj('checklist', `s${n}/${id}`, `S${n} checklist · ${id}`);
  }
  function ticket(n, id) {
    return obj('ticket', `s${n}/${id}`, `S${n} exit ticket · ${id}`);
  }
  function rubricCriterion(d, cKey) {
    return obj('rubric-criterion', `${d}/${cKey}`, `${d} · ${cKey}`);
  }

  // ── Optional LRS flush ──────────────────────────────────────
  let flushTimer = null;
  async function flush() {
    if (!CONFIG.endpoint) return;
    const q = readQueue();
    if (!q.length) return;
    try {
      const resp = await fetch(CONFIG.endpoint, {
        method: 'POST',
        headers: Object.assign(
          { 'Content-Type': 'application/json', 'X-Experience-API-Version': '1.0.3' },
          CONFIG.authHeader ? { Authorization: CONFIG.authHeader } : {},
        ),
        body: JSON.stringify(q),
      });
      if (resp.ok) writeQueue([]);
    } catch (e) {
      // keep queue; try again next interval
    }
  }
  function startAutoFlush() {
    if (flushTimer || !CONFIG.endpoint) return;
    flushTimer = setInterval(flush, CONFIG.flushIntervalMs);
  }

  // ── Public API ──────────────────────────────────────────────
  window.xapi = {
    emit,
    activities: { session, deliverable, checklistItem, ticket, rubricCriterion, obj },
    readQueue,
    writeQueue,
    clearQueue: () => writeQueue([]),
    setCohort,
    getCohort: () => localStorage.getItem(COHORT_KEY) || 'unassigned',
    getActorId: () => { const a = getActor(); return a.account.name; },
    flush,
    startAutoFlush,
    V,
    CONFIG,
  };

  startAutoFlush();
})();
