(() => {
  const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim();

  const style = () => {
    if (document.getElementById('tp-canvas-shell-styles')) return;
    const node = document.createElement('style');
    node.id = 'tp-canvas-shell-styles';
    node.textContent = `
      :root {
        --tp-canvas-crimson: #8b1538;
        --tp-canvas-crimson-dark: #6f102d;
        --tp-canvas-ink: #253142;
        --tp-canvas-muted: #596579;
        --tp-canvas-line: #d9dee7;
        --tp-canvas-surface: #ffffff;
        --tp-canvas-background: #f3f5f8;
      }

      body.tp-bespoke-home {
        background: var(--tp-canvas-background) !important;
        color: var(--tp-canvas-ink);
        overflow-x: hidden;
      }

      body.tp-bespoke-home .tp-bespoke-topnav {
        height: 64px !important;
        padding: 0 !important;
        background: var(--tp-canvas-surface) !important;
        border-bottom: 1px solid var(--tp-canvas-line) !important;
        box-shadow: 0 1px 3px rgba(31, 41, 55, .06) !important;
      }

      body.tp-bespoke-home .tp-bespoke-topnav > div {
        width: 100% !important;
        max-width: none !important;
        height: 64px !important;
        padding: 0 24px !important;
      }

      body.tp-bespoke-home .tp-bespoke-topnav > div > div:first-child {
        min-width: 245px;
        gap: 10px !important;
      }

      body.tp-bespoke-home .tp-bespoke-topnav > div > div:first-child > div:first-child {
        border-radius: 3px !important;
        box-shadow: none !important;
      }

      body.tp-bespoke-home .tp-bespoke-topnav button {
        min-height: 38px;
        padding: 8px 12px !important;
        border: 0 !important;
        border-radius: 3px !important;
        color: var(--tp-canvas-ink) !important;
        font-size: 14px !important;
        font-weight: 700 !important;
        box-shadow: none !important;
      }

      body.tp-bespoke-home .tp-bespoke-topnav button:hover,
      body.tp-bespoke-home .tp-bespoke-topnav button:focus-visible {
        background: #f3e9ed !important;
        color: var(--tp-canvas-crimson) !important;
      }

      body.tp-bespoke-home .tp-bespoke-topnav button:last-child {
        border: 1px solid var(--tp-canvas-line) !important;
        background: var(--tp-canvas-crimson) !important;
        color: #fff !important;
      }

      body.tp-bespoke-home .tp-bespoke-topnav button:last-child * {
        color: #fff !important;
      }

      body.tp-bespoke-home .tp-bespoke-topnav button:last-child:hover,
      body.tp-bespoke-home .tp-bespoke-topnav button:last-child:focus-visible {
        background: var(--tp-canvas-crimson-dark) !important;
        color: #fff !important;
      }

      body.tp-bespoke-home .site-header__search {
        border: 1px solid var(--tp-canvas-line) !important;
        border-radius: 4px !important;
        box-shadow: 0 2px 8px rgba(31, 41, 55, .08) !important;
      }

      body.tp-bespoke-home .site-header__search input {
        min-height: 38px !important;
        border-radius: 4px !important;
      }

      body.tp-bespoke-home button[aria-label="Open AI tutor"] {
        right: 20px !important;
        bottom: 20px !important;
        width: auto !important;
        min-width: 96px !important;
        height: 36px !important;
        gap: 7px !important;
        padding: 8px 12px !important;
        border: 1px solid var(--tp-canvas-crimson) !important;
        border-radius: 4px !important;
        box-shadow: 0 2px 6px rgba(31, 41, 55, .10) !important;
        font-size: 12px !important;
        font-weight: 800 !important;
      }

      body.tp-bespoke-home button[aria-label="Open AI tutor"]::after {
        content: "AI tutor";
        white-space: nowrap;
      }

      /* Keep the Canvas shell calm: utility actions are controls, not pills. */
      body.tp-bespoke-home #root button[class*="rounded-full"],
      body.tp-bespoke-home #root a[class*="rounded-full"],
      body.tp-bespoke-home .tp-landing-polished .tp-hero-actions button,
      body.tp-bespoke-home .tp-landing-polished .tp-beginner-hero-cue button,
      body.tp-bespoke-home .tp-beginner-start__actions button,
      body.tp-bespoke-home .tp-beginner-start__actions a,
      body.tp-bespoke-home #tp-presurvey-banner a,
      body.tp-bespoke-home #tp-beginner-toast,
      body.tp-bespoke-home #tp-beginner-toast button,
      body.tp-bespoke-home #tp-portfolio-review button,
      body.tp-bespoke-home #tp-app-search .site-header__search-btn {
        border-radius: 4px !important;
      }

      body.tp-bespoke-home #tp-beginner-toast {
        box-shadow: 0 4px 16px rgba(31, 41, 55, .12) !important;
      }

      body.tp-bespoke-home #tp-app-search .site-header__search-btn {
        width: 32px !important;
        height: 32px !important;
        min-width: 32px !important;
        min-height: 32px !important;
      }

      body.tp-bespoke-home #root button[aria-label="Open AI tutor"][class*="shadow-xl"] {
        box-shadow: 0 2px 6px rgba(31, 41, 55, .10) !important;
      }

      body.tp-bespoke-home .tp-canvas-context {
        position: relative;
        z-index: 20;
        display: flex;
        align-items: center;
        gap: 20px;
        min-height: 48px;
        padding: 8px 24px;
        border-bottom: 1px solid var(--tp-canvas-line);
        background: #fff;
        color: var(--tp-canvas-muted);
        font-size: 12px;
      }

      body.tp-bespoke-home .tp-canvas-context strong {
        color: var(--tp-canvas-ink);
        font-size: 13px;
      }

      body.tp-bespoke-home .tp-canvas-context__status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-left: auto;
        white-space: nowrap;
      }

      body.tp-bespoke-home .tp-canvas-context__dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #3d8b61;
      }

      body.tp-bespoke-home .tp-canvas-sidebar {
        position: fixed;
        z-index: 40;
        top: 64px;
        bottom: 0;
        left: 0;
        display: flex;
        width: 224px;
        flex-direction: column;
        gap: 4px;
        overflow-y: auto;
        padding: 22px 14px 18px;
        border-right: 1px solid var(--tp-canvas-line);
        background: #fff;
      }

      body.tp-bespoke-home .tp-canvas-sidebar__eyebrow {
        margin: 0 10px 6px;
        color: var(--tp-canvas-muted);
        font-size: 10px;
        font-weight: 800;
        letter-spacing: .12em;
        text-transform: uppercase;
      }

      body.tp-bespoke-home .tp-canvas-sidebar__title {
        margin: 0 10px 18px;
        color: var(--tp-canvas-ink);
        font-family: Inter, Arial, sans-serif;
        font-size: 15px;
        font-weight: 800;
        line-height: 1.3;
      }

      body.tp-bespoke-home .tp-canvas-sidebar button {
        display: flex;
        width: 100%;
        align-items: center;
        gap: 10px;
        min-height: 40px;
        padding: 9px 10px;
        border: 0;
        border-left: 3px solid transparent;
        border-radius: 3px;
        background: transparent;
        color: var(--tp-canvas-ink);
        font-size: 13px;
        font-weight: 700;
        text-align: left;
        cursor: pointer;
      }

      body.tp-bespoke-home .tp-canvas-sidebar button:hover,
      body.tp-bespoke-home .tp-canvas-sidebar button:focus-visible,
      body.tp-bespoke-home .tp-canvas-sidebar button[aria-current="page"] {
        border-left-color: var(--tp-canvas-crimson);
        background: #f7edf0;
        color: var(--tp-canvas-crimson);
        outline: none;
      }

      body.tp-bespoke-home .tp-canvas-sidebar__divider {
        height: 1px;
        margin: 18px 10px 12px;
        background: var(--tp-canvas-line);
      }

      body.tp-bespoke-home .tp-canvas-sidebar__meta {
        margin: auto 10px 0;
        padding-top: 16px;
        border-top: 1px solid var(--tp-canvas-line);
        color: var(--tp-canvas-muted);
        font-size: 11px;
        line-height: 1.5;
      }

      body.tp-bespoke-home.tp-canvas-workspace #root > div {
        margin-left: 224px;
      }

      body.tp-bespoke-home.tp-canvas-workspace .tp-canvas-context {
        margin-left: 224px;
      }

      body.tp-bespoke-home.tp-canvas-workspace nav.fixed.w-full {
        left: 224px !important;
        right: 0 !important;
        width: auto !important;
      }

      body.tp-bespoke-home.tp-canvas-workspace .tp-beginner-start,
      body.tp-bespoke-home.tp-canvas-workspace .tp-student-guide-links {
        max-width: none;
      }

      body.tp-bespoke-home .tp-landing-polished .tp-hero-grid {
        min-height: 680px !important;
      }

      body.tp-bespoke-home .tp-landing-polished .tp-hero-title {
        max-width: 760px;
        font-size: clamp(48px, 5.2vw, 68px) !important;
        line-height: 1.04 !important;
      }

      @media (max-width: 900px) {
        body.tp-bespoke-home .tp-canvas-sidebar { display: none; }
        body.tp-bespoke-home.tp-canvas-workspace #root > div,
        body.tp-bespoke-home.tp-canvas-workspace .tp-canvas-context { margin-left: 0; }
        body.tp-bespoke-home.tp-canvas-workspace nav.fixed.w-full {
          left: 0 !important;
          width: 100% !important;
        }
        body.tp-bespoke-home .tp-bespoke-topnav > div { padding: 0 14px !important; }
        body.tp-bespoke-home .tp-bespoke-topnav > div > div:first-child { min-width: auto; }
        body.tp-bespoke-home .tp-bespoke-topnav > div > div:first-child p { display: none; }
        body.tp-bespoke-home .tp-canvas-context { padding: 8px 14px; }
      }

      @media (max-width: 640px) {
        body.tp-bespoke-home .tp-bespoke-topnav { height: 58px !important; }
        body.tp-bespoke-home .tp-bespoke-topnav > div { height: 58px !important; }
        body.tp-bespoke-home .tp-bespoke-topnav > div > div:nth-child(2) button:not(:last-child) { display: none; }
        body.tp-bespoke-home .tp-canvas-context { min-height: 42px; }
        body.tp-bespoke-home .tp-canvas-context__status { display: none; }
      }
    `;
    document.head.appendChild(node);
  };

  const findNavButton = (label) => [...document.querySelectorAll('.tp-bespoke-topnav button')]
    .find((button) => normalize(button.textContent) === label);

  const createSidebar = () => {
    if (document.querySelector('.tp-canvas-sidebar')) return;
    const aside = document.createElement('aside');
    aside.className = 'tp-canvas-sidebar';
    aside.setAttribute('aria-label', 'TeachPlay course navigation');
    aside.innerHTML = `
      <p class="tp-canvas-sidebar__eyebrow">Course navigation</p>
      <h2 class="tp-canvas-sidebar__title">AI-Enhanced Educational Game Design</h2>
      <button type="button" data-tp-canvas-target="My Dashboard"><span aria-hidden="true">▣</span><span>Overview</span></button>
      <button type="button" data-tp-canvas-target="Catalog"><span aria-hidden="true">▤</span><span>Credential catalog</span></button>
      <button type="button" data-tp-canvas-target="Instructor tools"><span aria-hidden="true">◫</span><span>Instructor tools</span></button>
      <div class="tp-canvas-sidebar__divider"></div>
      <p class="tp-canvas-sidebar__eyebrow">Workspace</p>
      <button type="button" aria-label="Workspace overview" data-tp-canvas-target="My Dashboard"><span aria-hidden="true">↗</span><span>Progress &amp; evidence</span></button>
      <p class="tp-canvas-sidebar__meta">Use the course navigation to return to your overview, inspect credential requirements, or switch to instructor review.</p>
    `;
    aside.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-tp-canvas-target]');
      if (!button) return;
      const target = findNavButton(button.getAttribute('data-tp-canvas-target'));
      if (target) target.click();
    });
    document.body.appendChild(aside);
  };

  const updateContext = (isWorkspace) => {
    const root = document.querySelector('#root > div');
    if (!root) return;
    const heading = [...root.querySelectorAll('h1')].find((element) => normalize(element.textContent));
    const title = normalize(heading?.textContent) || 'Credential workspace';
    let context = document.querySelector('.tp-canvas-context');
    if (!context) {
      context = document.createElement('div');
      context.className = 'tp-canvas-context';
      const nav = document.querySelector('.tp-bespoke-topnav');
      if (nav) nav.insertAdjacentElement('afterend', context);
    }
    context.innerHTML = `<strong>TeachPlay course</strong><span aria-hidden="true">/</span><span>${title}</span><span class="tp-canvas-context__status"><i class="tp-canvas-context__dot" aria-hidden="true"></i>Workspace ready</span>`;
    context.hidden = !isWorkspace;
  };

  const update = () => {
    style();
    const root = document.querySelector('#root > div');
    if (!root) return;
    const headingText = normalize([...root.querySelectorAll('h1')].find((element) => normalize(element.textContent))?.textContent);
    const isLanding = headingText === 'Build serious learning games educators can actually defend.';
    const isWorkspace = !isLanding;
    document.body.classList.toggle('tp-canvas-workspace', isWorkspace);
    if (isWorkspace) {
      createSidebar();
      updateContext(true);
    } else {
      document.querySelector('.tp-canvas-sidebar')?.remove();
      updateContext(false);
    }
    const sideButtons = [...document.querySelectorAll('.tp-canvas-sidebar button[data-tp-canvas-target]')];
    sideButtons.forEach((button) => {
      const target = findNavButton(button.getAttribute('data-tp-canvas-target'));
      const active = target && ((target.getAttribute('aria-current') || '') === 'page' || target.classList.contains('active'));
      button.setAttribute('aria-current', active ? 'page' : 'false');
    });
  };

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      update();
    });
  };

  update();
  setTimeout(update, 250);
  setTimeout(update, 1000);
  const root = document.getElementById('root');
  if (root) new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
})();
