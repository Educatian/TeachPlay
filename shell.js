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

  function getDoneSet() {
    try { return new Set(JSON.parse(localStorage.getItem(LS_DONE) || '[]')); }
    catch { return new Set(); }
  }
  function saveDoneSet(set) {
    localStorage.setItem(LS_DONE, JSON.stringify([...set]));
  }

  function currentSession() {
    const m = location.pathname.match(/session-(\d+)\.html/);
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

  // ── Boot ────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    const sb = document.querySelector('[data-sidebar]');
    if (sb) renderSidebar(sb);
    wireChecklists();
    wireTickets();
    wirePrint();
    wireMarkDone();
    wireCrosswalk();

    // Index page renderer (if present)
    const landingGrid = document.querySelector('[data-session-grid]');
    if (landingGrid) {
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
  });
})();
