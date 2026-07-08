// shell.js — shared sidebar, progress tracking, checklist + ticket persistence

(function () {
  const SESSIONS = [
    { n: 1,  file: 'session-01.html', title: 'Framing',                  desc: 'What is, and is not, an educational game' },
    { n: 2,  file: 'session-02.html', title: 'Learner & context',        desc: 'Analysis, personas, constraints, problem statement' },
    { n: 3,  file: 'session-03.html', title: 'Objectives & crosswalk',   desc: 'Objective types and the signature mechanic-mapping tool' },
    { n: 4,  file: 'session-04.html', title: 'Mechanics I',              desc: 'Challenge, feedback, productive failure' },
    { n: 5,  file: 'session-05.html', title: 'Mechanics II',             desc: 'Narrative, role, collaboration structure' },
    { n: 6,  file: 'session-06.html', title: 'Facilitator design',       desc: 'The guide a colleague can run from' },
    { n: 7,  file: 'session-07.html', title: 'Low-fi prototyping',       desc: 'A playable-at-table loop in under five minutes' },
    { n: 8,  file: 'session-08.html', title: 'Interaction spec',         desc: 'State machine, event-feedback map, Three.js bridge' },
    { n: 9,  file: 'session-09.html', title: 'Playtest design',          desc: 'Runnable protocol; target learners, not peers' },
    { n: 10, file: 'session-10.html', title: 'Audit',                    desc: 'Reward, load, accessibility, ethics, data' },
    { n: 11, file: 'session-11.html', title: 'Revision studio',          desc: 'Unstructured clinic; apply playtest findings' },
    { n: 12, file: 'session-12.html', title: 'Final presentations',      desc: 'Nine-point frame and credential review' },
  ];

  window.HANDBOOK_SESSIONS = SESSIONS;

  // LocalStorage helpers
  const LS_DONE = 'hb:done';
  const LS_CHECK = (sessionN, itemId) => `hb:s${sessionN}:chk:${itemId}`;
  const LS_TICKET = (sessionN, id) => `hb:s${sessionN}:ticket:${id}`;
  const LS_SA = (phase, skill) => `hb:self-assess:${phase}:${skill}`;

  function getDoneSet() {
    try { return new Set(JSON.parse(localStorage.getItem(LS_DONE) || '[]')); }
    catch { return new Set(); }
  }
  function saveDoneSet(set) {
    localStorage.setItem(LS_DONE, JSON.stringify([...set]));
    for (let i = 1; i <= SESSIONS.length; i++) {
      const key = `hb:session_complete:s${String(i).padStart(2, '0')}`;
      if (set.has(i)) localStorage.setItem(key, 'true');
      else localStorage.removeItem(key);
    }
    window.dispatchEvent(new CustomEvent('hb:progress-updated', {
      detail: { completed: [...set] }
    }));
  }

  function currentSession() {
    const m = location.pathname.match(/session-(\d+)(?:\.html)?\/?$/);
    return m ? parseInt(m[1], 10) : null;
  }

  // ── Sidebar render ────────────────────────────────────────────
  function renderSidebar(mountEl) {
    const curr = currentSession();
    const done = getDoneSet();

    const groups = [
      { label: 'Part 1 · Foundations', ids: [1, 2] },
      { label: 'Part 2 · Design toolkit', ids: [3, 4, 5, 6] },
      { label: 'Part 3 · Build & test', ids: [7, 8, 9] },
      { label: 'Part 4 · Audit & close', ids: [10, 11, 12] },
    ];

    const progressPct = Math.round((done.size / SESSIONS.length) * 100);

    let html = `
      <div class="sidebar-brand">
        <div class="sidebar-brand__eyebrow">Micro-credential</div>
        <div class="sidebar-brand__title">AI-enhanced<br/>Educational<br/>Game Design</div>
        <div class="sidebar-brand__meta">v2 · 12 sessions</div>
      </div>
      <nav class="toc" aria-label="Sessions">
    `;

    for (const g of groups) {
      html += `<div class="toc__group-label">${g.label}</div>`;
      for (const id of g.ids) {
        const s = SESSIONS[id - 1];
        const isActive = curr === s.n ? 'is-active' : '';
        const isDone = done.has(s.n) ? 'is-done' : '';
        html += `
          <a class="toc__item ${isActive} ${isDone}" href="${s.file}">
            <span class="toc__num">${String(s.n).padStart(2, '0')}</span>
            <span class="toc__title">${s.title}</span>
            <span class="toc__check" aria-hidden="true"></span>
          </a>
        `;
      }
    }

    html += `
      </nav>
      <div class="sidebar__footer">
        <div>Progress · ${done.size}/${SESSIONS.length} sessions</div>
        <div class="progress-bar"><div class="progress-bar__fill" style="width:${progressPct}%"></div></div>
        <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 6px;">
          <a href="resources.html">📚 Resource library</a>
          <a href="index.html">← All sessions</a>
        </div>
      </div>
    `;

    mountEl.innerHTML = html;
  }

  // ── Mark-done toggle on the current session ──────────────────
  function toggleCurrentDone() {
    const n = currentSession();
    if (!n) return;
    const done = getDoneSet();
    const nowDone = !done.has(n);
    if (done.has(n)) done.delete(n); else done.add(n);
    saveDoneSet(done);
    if (window.xapi) {
      window.xapi.emit(
        nowDone ? 'completed' : 'experienced',
        window.xapi.activities.session(n),
        { result: { completion: nowDone } }
      );
      if (nowDone && localStorage.getItem('hb:learner_id') && typeof window.xapi.flush === 'function') {
        window.xapi.flush();
      }
    }
    // refresh sidebar if present
    const sb = document.querySelector('[data-sidebar]');
    if (sb) renderSidebar(sb);
    // update the button label if any
    document.querySelectorAll('[data-mark-done]').forEach(btn => {
      btn.textContent = done.has(n) ? '✓ Session complete' : 'Mark session complete';
      btn.classList.toggle('is-done', done.has(n));
    });
  }

  // ── Checklist ────────────────────────────────────────────────
  function wireChecklists() {
    const n = currentSession();
    if (!n) return;
    document.querySelectorAll('.checklist').forEach(list => {
      const items = list.querySelectorAll('li[data-chk-id]');
      items.forEach(li => {
        const id = li.dataset.chkId;
        const cb = li.querySelector('input[type=checkbox]');
        const saved = localStorage.getItem(LS_CHECK(n, id)) === '1';
        if (cb) cb.checked = saved;
        if (saved) li.classList.add('is-done');

        const toggle = () => {
          if (!cb) return;
          localStorage.setItem(LS_CHECK(n, id), cb.checked ? '1' : '0');
          li.classList.toggle('is-done', cb.checked);
          if (window.xapi) {
            window.xapi.emit(
              cb.checked ? 'completed' : 'experienced',
              window.xapi.activities.checklistItem(n, id),
              { parent: window.xapi.activities.session(n),
                result: { completion: cb.checked } }
            );
          }
        };
        if (cb) cb.addEventListener('change', toggle);
        li.addEventListener('click', (e) => {
          if (e.target === cb) return;
          cb.checked = !cb.checked;
          toggle();
        });
      });
    });
  }

  // ── Exit-ticket textarea persistence ─────────────────────────
  function wireTickets() {
    const n = currentSession();
    if (!n) return;
    document.querySelectorAll('.ticket[data-ticket-id]').forEach(t => {
      const id = t.dataset.ticketId;
      const ta = t.querySelector('textarea');
      const saved = t.querySelector('.ticket__saved');
      if (!ta) return;
      ta.value = localStorage.getItem(LS_TICKET(n, id)) || '';
      const flash = () => {
        if (saved) {
          saved.textContent = 'Saved · ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        }
      };
      let timer = null;
      let emitTimer = null;
      ta.addEventListener('input', () => {
        localStorage.setItem(LS_TICKET(n, id), ta.value);
        if (timer) clearTimeout(timer);
        timer = setTimeout(flash, 300);
        if (window.xapi) {
          if (emitTimer) clearTimeout(emitTimer);
          emitTimer = setTimeout(() => {
            window.xapi.emit('responded',
              window.xapi.activities.ticket(n, id),
              { parent: window.xapi.activities.session(n),
                result: { response: ta.value.slice(0, 4096) } });
          }, 2000);
        }
      });
      if (ta.value) flash();
    });
  }

  // ── Self-assessment (pre/post) ───────────────────────────────
  function wireSelfAssessment() {
    document.querySelectorAll('.self-assess[data-self-assessment]').forEach(host => {
      const phase = host.dataset.selfAssessment; // "pre" | "post"
      const saved = host.querySelector('.self-assess__saved');
      const flash = () => {
        if (saved) saved.textContent = 'Saved · ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
      };
      host.querySelectorAll('.self-assess__row').forEach(row => {
        const skill = row.dataset.skill;
        const prior = localStorage.getItem(LS_SA(phase, skill));
        if (prior !== null) {
          const input = row.querySelector(`input[value="${prior}"]`);
          if (input) input.checked = true;
        }
        row.querySelectorAll('input[type="radio"]').forEach(inp => {
          inp.addEventListener('change', () => {
            if (!inp.checked) return;
            const v = Number(inp.value);
            localStorage.setItem(LS_SA(phase, skill), String(v));
            flash();
            if (window.xapi) {
              const obj = window.xapi.activities.obj('self-assessment', `${phase}/${skill}`, `Self-assessment ${phase} · ${skill}`);
              window.xapi.emit('responded', obj, {
                result: {
                  response: String(v),
                  score: { raw: v, min: 0, max: 4, scaled: v / 4 },
                  extensions: {
                    'https://teachplay.dev/ext/sa-phase': phase,
                    'https://teachplay.dev/ext/sa-skill': skill,
                  },
                },
              });
            }
          });
        });
      });
    });
  }

  // ── Print button ─────────────────────────────────────────────
  function wirePrint() {
    document.querySelectorAll('[data-print]').forEach(btn => {
      btn.addEventListener('click', () => window.print());
    });
  }

  // ── Mark-done button ─────────────────────────────────────────
  function wireMarkDone() {
    const n = currentSession();
    if (!n) return;
    const done = getDoneSet();
    document.querySelectorAll('[data-mark-done]').forEach(btn => {
      btn.textContent = done.has(n) ? '✓ Session complete' : 'Mark session complete';
      btn.classList.toggle('is-done', done.has(n));
      btn.addEventListener('click', toggleCurrentDone);
    });
  }

  // ── Interactive crosswalk ────────────────────────────────────
  // Renders into <div data-crosswalk></div>
  function wireCrosswalk() {
    const host = document.querySelector('[data-crosswalk]');
    if (!host) return;

    const OBJECTIVES = [
      { key: 'retrieval',     label: 'Retrieval' },
      { key: 'discrimination',label: 'Discrimination' },
      { key: 'procedural',    label: 'Procedural fluency' },
      { key: 'conceptual',    label: 'Conceptual reasoning' },
      { key: 'judgment',      label: 'Judgment under uncertainty' },
    ];
    const MECHANICS = [
      { name: 'Spaced retrieval / flashcard',  fits: ['strong','weak','weak','weak','weak'] },
      { name: 'Matching / sorting',            fits: ['fair','strong','weak','fair','weak'] },
      { name: 'Timed execution / drill',       fits: ['fair','fair','strong','weak','risky'] },
      { name: 'Branching decision tree',       fits: ['weak','fair','fair','strong','strong'] },
      { name: 'Simulation (hidden variables)', fits: ['weak','weak','fair','strong','strong'] },
      { name: 'Resource management',           fits: ['weak','weak','fair','fair','strong'] },
      { name: 'Collaborative role play',       fits: ['weak','fair','fair','strong','strong'] },
      { name: 'Open exploration',              fits: ['weak','fair','weak','strong','fair'] },
      { name: 'Competitive leaderboard',       fits: ['fair','weak','fair','weak','risky'] },
      { name: 'Narrative framing (amp.)',      fits: ['amp','amp','amp','amp','amp'] },
    ];
    const SYM = { strong: '●', fair: '○', weak: '·', risky: '×', amp: '+' };
    const CLASSNAME = { strong: 'fit-strong', fair: 'fit-fair', weak: 'fit-weak', risky: 'fit-risky', amp: 'fit-amp' };

    let activeCol = 4; // default: Judgment highlighted

    function render() {
      const optBtns = OBJECTIVES.map((o, i) => `
        <button class="crosswalk__opt ${i === activeCol ? 'is-active' : ''}" data-col="${i}">${o.label}</button>
      `).join('');

      let gridCells = `<div class="crosswalk__head" style="border-left: 1px solid var(--gray-80);">Mechanic ↓ / Objective →</div>`;
      OBJECTIVES.forEach((o, i) => {
        gridCells += `<div class="crosswalk__head ${i === activeCol ? 'is-highlighted' : ''}">${o.label}</div>`;
      });
      MECHANICS.forEach(m => {
        gridCells += `<div class="crosswalk__rowlabel" style="border-left: 1px solid var(--gray-80);">${m.name}</div>`;
        m.fits.forEach((f, i) => {
          const hl = i === activeCol ? 'is-highlighted' : '';
          gridCells += `<div class="crosswalk__cell ${CLASSNAME[f]} ${hl}" title="${f}">${SYM[f]}</div>`;
        });
      });

      host.innerHTML = `
        <div class="crosswalk__bar">
          <div class="crosswalk__barlabel">Pick an objective type — see which mechanics fit</div>
          <div class="crosswalk__selector">${optBtns}</div>
        </div>
        <div class="crosswalk__grid">${gridCells}</div>
        <div class="crosswalk__legend">
          <span><b style="color:var(--blue-40)">●</b> Strong fit</span>
          <span><b style="color:var(--gray-30)">○</b> Fair</span>
          <span><b style="color:var(--gray-50)">·</b> Weak</span>
          <span><b style="color:var(--red-40)">×</b> Risky</span>
          <span><b style="color:var(--yellow-30)">+</b> Amplifier</span>
        </div>
      `;

      host.querySelectorAll('.crosswalk__opt').forEach(btn => {
        btn.addEventListener('click', () => {
          activeCol = parseInt(btn.dataset.col, 10);
          render();
        });
      });
    }
    render();
  }

  // ── Shared injected styles (session search + help link) ─────
  function injectSessionChromeStyles() {
    if (document.getElementById('hb-session-chrome-style')) return;
    const style = document.createElement('style');
    style.id = 'hb-session-chrome-style';
    style.setAttribute('data-source', 'shell.js');
    style.textContent = `
.handbook-topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.handbook-topbar .primary-nav { flex: 1 1 auto; min-width: 0; }
.handbook-topbar .site-header__search { flex: 0 0 auto; padding: 8px 0; }
@media (max-width: 820px) {
  .handbook-topbar .site-header__search { width: 100%; padding: 0 0 10px; }
  .handbook-topbar .site-header__search input { flex: 1 1 auto; width: auto; }
}
.session-help { margin: 14px 0 0; padding: 0 40px 8px; font-family: var(--font-sans, sans-serif); font-size: 12.5px; color: var(--gray-40, #777); text-align: right; }
.session-help a { color: var(--crimson, #be1a2f); }
@media print { .handbook-topbar .site-header__search, .session-help { display: none; } }
`;
    document.head.appendChild(style);
  }

  // ── Session-page search box ──────────────────────────────────
  // Other pages ship a static <form class="site-header__search"> that
  // search.js auto-wires; session pages had none. Inject the same form into
  // the session topbar so search.js (already loaded by every session page)
  // wires it to the shared autocomplete — one injection point, 12 pages.
  function injectSessionSearch() {
    if (!currentSession()) return;
    if (document.querySelector('form.site-header__search')) return;
    const topbar = document.querySelector('.handbook-topbar');
    if (!topbar) return;
    injectSessionChromeStyles();
    const form = document.createElement('form');
    form.className = 'site-header__search';
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.innerHTML = '<input type="search" placeholder="Search handbook…" aria-label="Search handbook" />' +
      '<button class="site-header__search-btn" aria-label="Search">🔍</button>';
    topbar.appendChild(form);
    // search.js exposes hbSearchInit for late-injected forms; if it hasn't
    // loaded yet, its own DOMContentLoaded init will pick the form up.
    if (typeof window.hbSearchInit === 'function') window.hbSearchInit();
  }

  // ── Session-page help affordance ─────────────────────────────
  // Quiet learner-facing contact next to the prev/next footer nav.
  // jmoon19@ua.edu is already the public issuer contact in the credential.
  function injectHelpLink() {
    const n = currentSession();
    if (!n) return;
    if (document.querySelector('.session-help')) return;
    const navEl = document.querySelector('.session-nav');
    if (!navEl) return;
    injectSessionChromeStyles();
    const p = document.createElement('p');
    p.className = 'session-help';
    p.innerHTML = 'Questions or stuck? <a href="mailto:jmoon19@ua.edu?subject=' +
      encodeURIComponent('TeachPlay question · Session ' + String(n).padStart(2, '0')) +
      '">Email the facilitator</a>';
    navEl.insertAdjacentElement('afterend', p);
  }

  function wireModuleVideo() {
    const n = currentSession();
    if (!n) return;
    if (document.querySelector('.video-slot[data-module-video]')) return;
    if (document.querySelector('#video .video-slot')) return;

    const current = SESSIONS[n - 1];
    const outcomes = document.querySelector('.content > section.block#outcomes');
    if (!outcomes || !current) return;

    const section = document.createElement('section');
    section.className = 'block';
    section.id = 'video';
    section.innerHTML = `
      <div class="block__kicker">02 · Two-host primer</div>
      <h2 class="block__title">${current.title} in 45 seconds</h2>
      <p class="block__subtitle">
        A short dialogue primer for the session's core design move. Watch it once before the activity, then use the same language when you critique your own project.
      </p>
      <div class="video-slot" data-module-video>
        <iframe class="video-slot__frame" src="module-video.html?m=${n}" title="Session ${String(n).padStart(2, '0')} two-host primer"></iframe>
        <div class="video-slot__caption">
          <span>Video · 00:45 · Session ${String(n).padStart(2, '0')}</span>
          <a href="module-video.html?m=${n}" target="_blank" rel="noopener">Open full →</a>
        </div>
      </div>
    `;
    outcomes.insertAdjacentElement('afterend', section);
  }

  // ── Index page session grid (if present) ────────────────────
  function renderLandingGrid(landingGrid) {
    const done = getDoneSet();
    landingGrid.innerHTML = SESSIONS.map(s => {
      const isDone = done.has(s.n) ? 'is-done' : '';
      return `
        <a href="${s.file}" class="session-card ${isDone}">
          <div class="session-card__num">
            <span>Session ${String(s.n).padStart(2, '0')}</span>
            <span class="session-card__check"></span>
          </div>
          <h3 class="session-card__title">${s.title}</h3>
          <p class="session-card__desc">${s.desc}</p>
          <div class="session-card__tag">Open</div>
        </a>
      `;
    }).join('');
  }

  // ── Server progress hydration ("resume on any device") ──────
  // Completions live in localStorage, but the server also knows them
  // (xAPI 'completed' events → GET /api/progress). On a browser that has a
  // learner identity (hb:learner_id + hb:learner_token, e.g. restored via
  // the progress-recovery email link) but no local completion marker for the
  // current session, pull the server's completed-session list once per tab
  // session and merge it into the local hb:done store, then refresh every
  // surface that reads it. Quiz answers are NOT hydrated (the server does
  // not store selections) — a server-complete session simply shows its
  // completed state and releases the quiz gate directly.
  const SS_HYDRATED = 'hb:progress-hydrated';

  function refreshProgressUI() {
    const sb = document.querySelector('[data-sidebar]');
    if (sb) renderSidebar(sb);
    const landingGrid = document.querySelector('[data-session-grid]');
    if (landingGrid) renderLandingGrid(landingGrid);
    const n = currentSession();
    if (!n) return;
    const done = getDoneSet();
    document.querySelectorAll('[data-mark-done]').forEach(btn => {
      btn.textContent = done.has(n) ? '✓ Session complete' : 'Mark session complete';
      btn.classList.toggle('is-done', done.has(n));
    });
  }

  // Mirror of quiz.js _releaseGate for the already-complete case: when the
  // server says this session is done, the completion button and next-nav
  // must not stay locked behind an unanswered local quiz. Uses the same
  // classes/dataset/expando quiz.js _applyGate writes.
  function releaseQuizGate() {
    document.querySelectorAll('.quiz__gate-reason').forEach(el => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    document.querySelectorAll('.quiz-gated, .quiz-gated-btn').forEach(el => {
      el.classList.remove('quiz-gated', 'quiz-gated-btn');
      el.removeAttribute('aria-disabled');
      if (el.dataset.quizGateOriginalTitle !== undefined) {
        if (el.dataset.quizGateOriginalTitle) el.setAttribute('title', el.dataset.quizGateOriginalTitle);
        else el.removeAttribute('title');
        delete el.dataset.quizGateOriginalTitle;
      }
      if (el.tagName === 'BUTTON') {
        el.disabled = false;
      } else {
        if (el.dataset.quizGateOriginalTabindex !== undefined) {
          if (el.dataset.quizGateOriginalTabindex) el.setAttribute('tabindex', el.dataset.quizGateOriginalTabindex);
          else el.removeAttribute('tabindex');
          delete el.dataset.quizGateOriginalTabindex;
        }
        if (el.__quizGateHandler) {
          el.removeEventListener('click', el.__quizGateHandler);
          delete el.__quizGateHandler;
        }
      }
    });
  }

  function hydrateFromServer() {
    let learnerId = null;
    let token = null;
    try {
      learnerId = localStorage.getItem('hb:learner_id');
      token = localStorage.getItem('hb:learner_token');
    } catch (_) { return; }
    if (!learnerId || !token) return;

    const n = currentSession();
    if (n && getDoneSet().has(n)) return; // local marker already present

    try {
      if (sessionStorage.getItem(SS_HYDRATED)) return; // once per tab session
      sessionStorage.setItem(SS_HYDRATED, '1');
    } catch (_) { /* sessionStorage unavailable — still hydrate this load */ }

    fetch('/api/progress?learner_id=' + encodeURIComponent(learnerId), {
      headers: { 'X-Learner-ID': learnerId, 'X-Learner-Token': token },
    })
      .then(res => (res.ok ? res.json() : null)) // 401/403/stale token → silent no-op
      .then(data => {
        if (!data || !data.ok || !data.completion || !Array.isArray(data.completion.sessions)) return;
        // activity_ids look like "session/s1" (xapi.js flush) or "session/s01"
        // (simplified posts) — same trailing-sNN parse progress.html uses.
        const serverDone = data.completion.sessions
          .map(s => { const m = String(s).match(/s(\d+)$/); return m ? parseInt(m[1], 10) : null; })
          .filter(x => x !== null && x >= 1 && x <= SESSIONS.length);
        if (!serverDone.length) return;
        const done = getDoneSet();
        const before = done.size;
        serverDone.forEach(x => done.add(x));
        if (done.size === before) return; // nothing new from the server
        saveDoneSet(done); // persists hb:done + hb:session_complete:sNN, fires hb:progress-updated
        refreshProgressUI();
        if (n && done.has(n)) releaseQuizGate();
      })
      .catch(() => {}); // network failure: keep local-only behavior, no console spam
  }

  // ── Boot ────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    const sb = document.querySelector('[data-sidebar]');
    if (sb) renderSidebar(sb);
    wireChecklists();
    wireTickets();
    wireSelfAssessment();
    wirePrint();
    wireMarkDone();
    wireCrosswalk();
    wireModuleVideo();
    injectSessionSearch();
    injectHelpLink();

    // A session that is already complete (server-hydrated on an earlier load,
    // or marked done on a previous visit) must not re-lock behind the quiz
    // gate on reload: hydration never restores quiz selections, so quiz.js
    // re-applies its 'attempt' gate at mount time even though the session is
    // done. Quiz.mount runs from an inline script during parse, so by
    // DOMContentLoaded the gate (if any) is in place and safe to release.
    const cur = currentSession();
    if (cur && getDoneSet().has(cur)) releaseQuizGate();

    hydrateFromServer();

    const landingGrid = document.querySelector('[data-session-grid]');
    if (landingGrid) renderLandingGrid(landingGrid);
  });
})();
