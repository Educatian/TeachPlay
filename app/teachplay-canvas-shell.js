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

      /* Learner landing: match the current Figma landing composition. */
      body.tp-bespoke-home .tp-canvas-context[hidden] { display: none !important; }
      body.tp-bespoke-home #tp-presurvey-banner {
        height: 34px !important;
        min-height: 34px !important;
        padding: 6px 24px !important;
        border-bottom: 1px solid #cbb677 !important;
        background: #fff7e6 !important;
        color: #4a4a4a !important;
        font-size: 12px !important;
        line-height: 1.2 !important;
      }
      body.tp-bespoke-home #tp-app-search,
      body.tp-bespoke-home button[aria-label="Open AI tutor"] { display: none !important; }
      body.tp-bespoke-home .tp-landing-polished {
        margin-top: 0 !important;
        background: #161616 !important;
      }
      body.tp-bespoke-home .tp-landing-polished .tp-hero-grid {
        width: min(1120px, calc(100% - 48px)) !important;
        min-height: 0 !important;
        padding: 128px 0 64px !important;
        align-items: start !important;
        grid-template-columns: minmax(0, 1fr) 480px !important;
        gap: 48px !important;
      }
      body.tp-bespoke-home .tp-landing-polished .tp-hero-copy {
        height: auto !important;
        min-height: 0 !important;
        padding: 0 !important;
      }
      body.tp-bespoke-home .tp-landing-polished .tp-hero-title {
        max-width: 620px !important;
        font-size: clamp(48px, 5.2vw, 68px) !important;
        line-height: 1.04 !important;
        letter-spacing: -.035em !important;
      }
      body.tp-bespoke-home .tp-landing-polished .tp-hero-lede {
        max-width: 595px !important;
        margin-top: 20px !important;
        color: #c9c9c9 !important;
        font-size: 18px !important;
        line-height: 1.45 !important;
      }
      body.tp-bespoke-home .tp-landing-polished .tp-hero-actions { margin-top: 30px !important; }
      body.tp-bespoke-home .tp-landing-polished .tp-beginner-hero-cue { display: none !important; }
      body.tp-bespoke-home .tp-landing-polished .tp-workspace-card {
        width: 480px !important;
        min-height: 0 !important;
        height: auto !important;
        border: 0 !important;
        border-radius: 8px !important;
        background: #5a0d18 !important;
        box-shadow: none !important;
        overflow: hidden !important;
      }
      body.tp-bespoke-home .tp-landing-polished .tp-workspace-card > div:first-child {
        min-height: 72px !important;
        padding: 16px 20px !important;
        border-bottom-color: rgba(255,255,255,.28) !important;
      }
      body.tp-bespoke-home .tp-landing-polished .tp-workspace-media {
        height: 92px !important;
        margin: 12px 20px 0 !important;
      }
      body.tp-bespoke-home .tp-landing-polished .tp-workspace-media figure,
      body.tp-bespoke-home .tp-landing-polished .tp-workspace-media img { height: 92px !important; }
      body.tp-bespoke-home .tp-landing-polished .tp-workspace-card > div:last-child {
        display: grid !important;
        gap: 8px !important;
        padding: 12px 20px 16px !important;
        background: #0b1220 !important;
      }
      body.tp-bespoke-home .tp-landing-polished .tp-workspace-card > div:last-child > .tp-workspace-row {
        min-height: 58px !important;
        padding: 10px 12px !important;
        border-radius: 4px !important;
      }
      body.tp-bespoke-home .tp-landing-polished .tp-workspace-card > div:last-child > .tp-workspace-footer {
        min-height: 64px !important;
        padding: 12px 14px !important;
        border-radius: 4px !important;
      }
      body.tp-bespoke-home .tp-landing-proof-band { padding: 60px 0 !important; background: #fff !important; }
      body.tp-bespoke-home .tp-landing-proof-band__inner {
        width: min(1120px, calc(100% - 48px));
        margin: 0 auto;
      }
      body.tp-bespoke-home .tp-landing-proof-band .tp-stat-grid {
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        gap: 32px !important;
        border: 0 !important;
        overflow: visible !important;
        background: transparent !important;
      }
      body.tp-bespoke-home .tp-landing-proof-band .tp-stat-chip {
        min-height: 120px !important;
        padding: 24px !important;
        border: 1px solid #e4e6e8 !important;
        border-radius: 8px !important;
        background: #fafafa !important;
        color: #161616 !important;
      }
      body.tp-bespoke-home .tp-landing-proof-band .tp-stat-chip > div:nth-child(2) {
        color: #6a727a !important;
      }
      body.tp-bespoke-home .tp-landing-proof-band .tp-stat-chip:last-child { border-right: 1px solid #e4e6e8 !important; }
      body.tp-bespoke-home .tp-landing-pathway,
      body.tp-bespoke-home .tp-landing-primer,
      body.tp-bespoke-home .tp-landing-curriculum {
        background: #f4f5f6 !important;
        border-color: #e4e6e8 !important;
      }
      body.tp-bespoke-home .tp-landing-pathway .tp-beginner-start,
      body.tp-bespoke-home .tp-landing-assets .tp-student-guide-links {
        width: min(1120px, calc(100% - 48px)) !important;
        margin: 0 auto !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }
      body.tp-bespoke-home .tp-landing-pathway .tp-beginner-start { background: transparent !important; }
      body.tp-bespoke-home .tp-landing-pathway .tp-beginner-start article,
      body.tp-bespoke-home .tp-landing-assets .tp-student-guide-links a {
        border-radius: 4px !important;
        border-color: #e4e6e8 !important;
        box-shadow: none !important;
      }
      body.tp-bespoke-home .tp-landing-access,
      body.tp-bespoke-home .tp-landing-cta { background: #fff !important; }
      body.tp-bespoke-home .tp-landing-standards { background: #5a0d18 !important; color: #fff !important; }
      body.tp-bespoke-home .tp-landing-standards [class*="text-slate"],
      body.tp-bespoke-home .tp-landing-standards [class*="text-gray"] { color: #f8e9ce !important; }
      body.tp-bespoke-home .tp-landing-curriculum article { border-radius: 4px !important; box-shadow: none !important; }
      body.tp-bespoke-home .tp-landing-footer { background: #161616 !important; }

      @media (max-width: 900px) {
        body.tp-bespoke-home .tp-landing-polished .tp-hero-grid {
          width: min(720px, calc(100% - 32px)) !important;
          grid-template-columns: 1fr !important;
          gap: 32px !important;
        }
        body.tp-bespoke-home .tp-landing-polished .tp-workspace-card { width: 100% !important; }
        body.tp-bespoke-home .tp-landing-proof-band .tp-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      }
      @media (max-width: 640px) {
        body.tp-bespoke-home #tp-presurvey-banner { padding: 6px 14px !important; overflow: hidden; white-space: nowrap; }
        body.tp-bespoke-home .tp-landing-polished .tp-hero-grid,
        body.tp-bespoke-home .tp-landing-proof-band__inner,
        body.tp-bespoke-home .tp-landing-pathway .tp-beginner-start,
        body.tp-bespoke-home .tp-landing-assets .tp-student-guide-links { width: min(100% - 28px, 680px) !important; }
        body.tp-bespoke-home .tp-landing-polished .tp-hero-grid { padding-top: 96px !important; }
        body.tp-bespoke-home .tp-landing-polished .tp-hero-title { font-size: 42px !important; }
        body.tp-bespoke-home .tp-landing-proof-band .tp-stat-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
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

  const styleFidelityLanding = () => {
    if (document.getElementById('tp-fidelity-landing-styles')) return;
    const node = document.createElement('style');
    node.id = 'tp-fidelity-landing-styles';
    node.textContent = `
      body.tp-fidelity-mode {
        background: #fff !important;
        color: #161616 !important;
        overflow-x: hidden;
      }
      body.tp-fidelity-mode .tp-fidelity-brand-bar {
        display: block;
        width: 100%;
        height: 6px;
        background: #9e1b32;
      }
      body.tp-fidelity-mode .tp-bespoke-topnav {
        position: relative !important;
        top: auto !important;
        left: auto !important;
        right: auto !important;
        z-index: 30 !important;
        height: 60px !important;
        min-height: 60px !important;
        max-height: 60px !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        padding: 0 !important;
        background: #fff !important;
        border-bottom: 1px solid #e4e6e8 !important;
        box-shadow: none !important;
      }
      body.tp-fidelity-mode .tp-bespoke-topnav > div {
        width: min(1120px, calc(100% - 48px)) !important;
        max-width: none !important;
        height: 60px !important;
        margin: 0 auto !important;
        padding: 0 !important;
      }
      body.tp-fidelity-mode .tp-bespoke-topnav > div > div:first-child {
        min-width: 0 !important;
        gap: 0 !important;
      }
      body.tp-fidelity-mode .tp-bespoke-topnav > div > div:first-child > div:first-child,
      body.tp-fidelity-mode .tp-bespoke-topnav > div > div:first-child p {
        display: none !important;
      }
      body.tp-fidelity-mode .tp-bespoke-topnav .tp-brand-text,
      body.tp-fidelity-mode .tp-bespoke-topnav > div > div:first-child > div:last-child > div {
        color: #9e1b32 !important;
        font-size: 12px !important;
        font-weight: 800 !important;
        letter-spacing: .02em !important;
        text-transform: uppercase;
      }
      body.tp-fidelity-mode .tp-bespoke-topnav > div > div:nth-child(2) {
        gap: 26px !important;
      }
      body.tp-fidelity-mode .tp-bespoke-topnav > div > div:nth-child(2) button,
      body.tp-fidelity-mode .tp-bespoke-topnav > div > div:last-child button[aria-label="Toggle color theme"] {
        min-height: 32px !important;
        padding: 6px 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        color: #232323 !important;
        box-shadow: none !important;
        font-size: 12px !important;
        font-weight: 500 !important;
      }
      body.tp-fidelity-mode .tp-bespoke-topnav > div > div:nth-child(2) button:hover,
      body.tp-fidelity-mode .tp-bespoke-topnav > div > div:nth-child(2) button:focus-visible {
        color: #9e1b32 !important;
        text-decoration: underline;
        text-underline-offset: 4px;
      }
      body.tp-fidelity-mode .tp-bespoke-topnav > div > div:last-child {
        gap: 12px !important;
      }
      body.tp-fidelity-mode .tp-bespoke-topnav > div > div:last-child button[aria-label="Toggle color theme"] {
        width: 28px !important;
        min-width: 28px !important;
        padding: 0 !important;
        opacity: .72;
      }
      body.tp-fidelity-mode .tp-bespoke-topnav > div > div:last-child > div button:last-child,
      body.tp-fidelity-mode .tp-bespoke-topnav > div > div:last-child button[data-tp-beginner-copy="true"] {
        min-height: 36px !important;
        padding: 8px 16px !important;
        border: 0 !important;
        border-radius: 4px !important;
        background: #9e1b32 !important;
        color: #fff !important;
        font-size: 12px !important;
        font-weight: 700 !important;
      }
      body.tp-fidelity-mode .tp-bespoke-topnav > div > div:last-child button[data-tp-beginner-copy="true"] * {
        color: #fff !important;
      }
      body.tp-fidelity-mode #tp-presurvey-banner {
        display: none !important;
      }
      body.tp-fidelity-mode .tp-fidelity-legacy {
        display: none !important;
      }
      body.tp-fidelity-mode .tp-fidelity-landing {
        display: block;
        width: 100%;
        background: #fff;
        font-family: Inter, Arial, sans-serif;
      }
      body.tp-fidelity-mode .tp-fidelity-hero {
        height: 580px;
        overflow: hidden;
        background: #161616;
        color: #fff;
      }
      body.tp-fidelity-mode .tp-fidelity-hero-inner,
      body.tp-fidelity-mode .tp-fidelity-band-inner {
        width: min(1120px, calc(100% - 48px));
        height: 100%;
        margin: 0 auto;
      }
      body.tp-fidelity-mode .tp-fidelity-hero-inner {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 480px;
        gap: 48px;
        padding-top: 80px;
      }
      body.tp-fidelity-mode .tp-fidelity-eyebrow {
        margin: 0;
        color: #cbb677;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: .02em;
      }
      body.tp-fidelity-mode .tp-fidelity-hero h1 {
        max-width: 620px;
        margin: 20px 0 0;
        color: #fff;
        font-size: clamp(48px, 5.1vw, 64px);
        font-weight: 800;
        letter-spacing: -.04em;
        line-height: 1.02;
      }
      body.tp-fidelity-mode .tp-fidelity-lede {
        max-width: 595px;
        margin: 18px 0 0;
        color: #bfbfbf;
        font-size: 18px;
        line-height: 1.32;
      }
      body.tp-fidelity-mode .tp-fidelity-actions {
        display: flex;
        gap: 16px;
        margin-top: 28px;
      }
      body.tp-fidelity-mode .tp-fidelity-actions button {
        min-width: 180px;
        height: 48px;
        padding: 10px 18px;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
      }
      body.tp-fidelity-mode .tp-fidelity-actions button:first-child {
        border: 1px solid #9e1b32;
        background: #9e1b32;
        color: #fff;
      }
      body.tp-fidelity-mode .tp-fidelity-actions button:last-child {
        border: 1px solid #737373;
        background: #161616;
        color: #e6e6e6;
      }
      body.tp-fidelity-mode .tp-fidelity-actions button:hover,
      body.tp-fidelity-mode .tp-fidelity-actions button:focus-visible {
        outline: 3px solid rgba(203,182,119,.48);
        outline-offset: 2px;
      }
      body.tp-fidelity-mode .tp-fidelity-notice {
        max-width: 570px;
        margin: 16px 0 0;
        color: #d9ccd1;
        font-size: 12px;
        line-height: 1.35;
      }
      body.tp-fidelity-mode .tp-fidelity-notice a {
        color: #cbb677;
        font-weight: 700;
        text-underline-offset: 3px;
      }
      body.tp-fidelity-mode .tp-fidelity-card {
        position: relative;
        width: 480px;
        height: 300px;
        margin-top: 38px;
        overflow: hidden;
        border: 0 !important;
        border-radius: 8px !important;
        background: #5a0d18 !important;
        color: #fff;
      }
      body.tp-fidelity-mode .tp-fidelity-card h2 {
        max-width: 370px;
        margin: 12px 32px 0;
        color: #fff;
        font-size: 26px;
        line-height: 1.05;
      }
      body.tp-fidelity-mode .tp-fidelity-card .tp-fidelity-card-label {
        margin: 32px 32px 0;
        color: #cbb677;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: .04em;
        text-transform: uppercase;
      }
      body.tp-fidelity-mode .tp-fidelity-card ul {
        margin: 18px 32px 0;
        padding-left: 16px;
        color: #d9ccd1;
        font-size: 14px;
        line-height: 1.24;
      }
      body.tp-fidelity-mode .tp-fidelity-card li { margin: 0; }
      body.tp-fidelity-mode .tp-fidelity-card-proof {
        position: absolute;
        right: 32px;
        bottom: 14px;
        margin: 0;
        color: #cbb677;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .04em;
        text-transform: uppercase;
      }
      body.tp-fidelity-mode .tp-fidelity-proof {
        height: 240px;
        background: #fff;
      }
      body.tp-fidelity-mode .tp-fidelity-proof .tp-fidelity-band-inner {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 32px;
        padding-top: 60px;
      }
      body.tp-fidelity-mode .tp-fidelity-stat {
        height: 120px;
        padding: 20px 24px;
        border: 1px solid #e4e6e8;
        border-radius: 8px;
        background: #fafafa;
      }
      body.tp-fidelity-mode .tp-fidelity-stat-label {
        color: #6a727a;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      body.tp-fidelity-mode .tp-fidelity-stat-value {
        margin-top: 4px;
        color: #161616;
        font-size: 44px;
        font-weight: 800;
        line-height: 1;
      }
      body.tp-fidelity-mode .tp-fidelity-stat-meta {
        margin-top: 4px;
        color: #6a727a;
        font-size: 14px;
        line-height: 1.2;
      }
      body.tp-fidelity-mode .tp-fidelity-pathway {
        height: 514px;
        overflow: hidden;
        background: #f4f5f6;
      }
      body.tp-fidelity-mode .tp-fidelity-pathway .tp-fidelity-band-inner {
        padding-top: 60px;
      }
      body.tp-fidelity-mode .tp-fidelity-section-label {
        margin: 0;
        color: #9e1b32;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: .02em;
        text-transform: uppercase;
      }
      body.tp-fidelity-mode .tp-fidelity-pathway h2 {
        margin: 10px 0 0;
        color: #161616;
        font-size: 34px;
        font-weight: 800;
        letter-spacing: -.025em;
        line-height: 1.15;
      }
      body.tp-fidelity-mode .tp-fidelity-section-lede {
        margin: 4px 0 0;
        color: #4a4a4a;
        font-size: 17px;
        line-height: 1.35;
      }
      body.tp-fidelity-mode .tp-fidelity-session-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
        margin-top: 34px;
      }
      body.tp-fidelity-mode .tp-fidelity-session {
        display: flex;
        min-height: 88px;
        align-items: flex-start;
        padding: 18px 20px;
        border: 1px solid #e4e6e8;
        border-radius: 0;
        background: #fff;
        color: #161616;
        text-decoration: none;
      }
      body.tp-fidelity-mode .tp-fidelity-session:hover,
      body.tp-fidelity-mode .tp-fidelity-session:focus-visible {
        border-color: #9e1b32;
        outline: 3px solid rgba(158,27,50,.18);
        outline-offset: 2px;
      }
      body.tp-fidelity-mode .tp-fidelity-session.is-deliverable {
        border-color: #9e1b32;
        background: #fdf4f5;
        color: #9e1b32;
      }
      body.tp-fidelity-mode .tp-fidelity-session-number,
      body.tp-fidelity-mode .tp-fidelity-session-name {
        display: block;
        font-size: 17px;
        font-weight: 700;
        line-height: 1.2;
      }
      body.tp-fidelity-mode .tp-fidelity-session-name { margin-top: 2px; }
      body.tp-fidelity-mode .tp-fidelity-standards {
        height: 240px;
        overflow: hidden;
        background: #5a0d18;
        color: #fff;
      }
      body.tp-fidelity-mode .tp-fidelity-standards .tp-fidelity-band-inner { padding-top: 60px; }
      body.tp-fidelity-mode .tp-fidelity-standards .tp-fidelity-section-label { color: #cbb677; }
      body.tp-fidelity-mode .tp-fidelity-standard-row {
        margin-top: 12px;
        color: #fff;
        font-size: 20px;
        font-weight: 700;
        word-spacing: 18px;
      }
      body.tp-fidelity-mode .tp-fidelity-standards .tp-fidelity-section-lede {
        max-width: 650px;
        margin-top: 18px;
        color: #d9ccd1;
        font-size: 15px;
      }
      body.tp-fidelity-mode .tp-fidelity-footer {
        height: 160px;
        overflow: hidden;
        background: #161616;
        color: #a6a6a6;
      }
      body.tp-fidelity-mode .tp-fidelity-footer .tp-fidelity-band-inner { padding-top: 52px; }
      body.tp-fidelity-mode .tp-fidelity-footer p {
        margin: 0;
        font-size: 14px;
        line-height: 1.45;
      }
      @media (max-width: 900px) {
        body.tp-fidelity-mode .tp-fidelity-hero { height: auto; min-height: 640px; }
        body.tp-fidelity-mode .tp-fidelity-hero-inner { grid-template-columns: 1fr; gap: 32px; padding-top: 64px; padding-bottom: 64px; }
        body.tp-fidelity-mode .tp-fidelity-card { width: 100%; max-width: 480px; margin-top: 0; }
        body.tp-fidelity-mode .tp-fidelity-pathway { height: auto; min-height: 700px; padding-bottom: 56px; }
        body.tp-fidelity-mode .tp-fidelity-session-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (max-width: 640px) {
        body.tp-fidelity-mode .tp-bespoke-topnav > div { width: calc(100% - 28px) !important; }
        body.tp-fidelity-mode .tp-bespoke-topnav > div > div:nth-child(2) { display: none; }
        body.tp-fidelity-mode .tp-bespoke-topnav > div > div:last-child button[aria-label="Toggle color theme"] { display: none; }
        body.tp-fidelity-mode .tp-fidelity-hero-inner,
        body.tp-fidelity-mode .tp-fidelity-band-inner { width: calc(100% - 28px); }
        body.tp-fidelity-mode .tp-fidelity-hero h1 { font-size: 42px; }
        body.tp-fidelity-mode .tp-fidelity-lede { font-size: 16px; }
        body.tp-fidelity-mode .tp-fidelity-actions { flex-direction: column; align-items: stretch; }
        body.tp-fidelity-mode .tp-fidelity-actions button { width: 100%; }
        body.tp-fidelity-mode .tp-fidelity-proof { height: auto; padding-bottom: 40px; }
        body.tp-fidelity-mode .tp-fidelity-proof .tp-fidelity-band-inner { grid-template-columns: 1fr; gap: 12px; padding-top: 40px; }
        body.tp-fidelity-mode .tp-fidelity-session-grid { grid-template-columns: 1fr; gap: 10px; margin-top: 24px; }
        body.tp-fidelity-mode .tp-fidelity-pathway h2 { font-size: 28px; }
        body.tp-fidelity-mode .tp-fidelity-standard-row { font-size: 16px; word-spacing: 8px; line-height: 1.5; }
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

  const resetFidelityLanding = () => {
    document.body.classList.remove('tp-fidelity-mode');
    document.querySelector('.tp-fidelity-landing')?.remove();
    document.querySelector('.tp-fidelity-brand-bar')?.remove();
    document.querySelectorAll('.tp-fidelity-legacy-card').forEach((node) => {
      node.classList.add('tp-workspace-card');
      node.classList.remove('tp-fidelity-legacy-card');
    });
    document.querySelectorAll('[data-tp-fidelity-hidden-action="true"]').forEach((node) => {
      const originalText = node.getAttribute('data-tp-fidelity-original-text');
      if (originalText !== null) node.textContent = originalText;
      const originalAria = node.getAttribute('data-tp-fidelity-original-aria');
      if (originalAria) node.setAttribute('aria-label', originalAria);
      else node.removeAttribute('aria-label');
      node.removeAttribute('aria-hidden');
      node.removeAttribute('tabindex');
      node.removeAttribute('data-tp-fidelity-hidden-action');
      node.removeAttribute('data-tp-fidelity-original-aria');
      node.removeAttribute('data-tp-fidelity-original-text');
      node.removeAttribute('data-tp-fidelity-source-start');
    });
    document.querySelectorAll('.tp-fidelity-legacy').forEach((node) => {
      node.classList.remove('tp-fidelity-legacy');
    });
  };

  const hideLegacyStartAction = () => {
    const landing = document.querySelector('.tp-fidelity-landing');
    if (!landing) return;
    [...document.querySelectorAll('#root button')]
      .filter((button) => !landing.contains(button)
        && /Start learning|Review the credential/i.test(normalize(button.textContent)))
      .forEach((button) => {
        if (!button.hasAttribute('data-tp-fidelity-original-text')) {
          button.setAttribute('data-tp-fidelity-original-text', button.textContent || '');
        }
        if (!button.hasAttribute('data-tp-fidelity-original-aria')) {
          button.setAttribute('data-tp-fidelity-original-aria', button.getAttribute('aria-label') || '');
        }
        button.textContent = 'Legacy learner entry';
        button.setAttribute('aria-label', 'Legacy learner entry control');
        button.setAttribute('aria-hidden', 'true');
        button.setAttribute('tabindex', '-1');
        button.setAttribute('data-tp-fidelity-source-start', 'true');
        button.setAttribute('data-tp-fidelity-hidden-action', 'true');
      });
  };

  const buildFidelityLanding = () => {
    const appShell = document.querySelector('#root > div > div');
    const nav = appShell?.querySelector('.tp-bespoke-topnav');
    if (!appShell || !nav) return;

    styleFidelityLanding();

    let brandBar = appShell.querySelector('.tp-fidelity-brand-bar');
    if (!brandBar) {
      brandBar = document.createElement('div');
      brandBar.className = 'tp-fidelity-brand-bar';
      brandBar.setAttribute('aria-hidden', 'true');
      nav.insertAdjacentElement('beforebegin', brandBar);
    }

    let landing = appShell.querySelector('.tp-fidelity-landing');
    if (!landing) {
      landing = document.createElement('section');
      landing.className = 'tp-fidelity-landing';
      landing.id = 'tp-fidelity-landing';
      landing.setAttribute('aria-label', 'TeachPlay learner landing');
      nav.insertAdjacentElement('afterend', landing);
      landing.innerHTML = `
        <header class="tp-fidelity-hero">
          <div class="tp-fidelity-hero-inner">
            <div class="tp-fidelity-hero-copy">
              <p class="tp-fidelity-eyebrow">THE UNIVERSITY OF ALABAMA · COLLEGE OF EDUCATION</p>
              <h1>AI-enhanced<br>Educational<br>Game Design</h1>
              <p class="tp-fidelity-lede">A twelve-session microcredential. One objective, one designed artifact, every week, scored against 25 criteria you can read before you start.</p>
              <div class="tp-fidelity-actions">
                <button type="button" aria-label="Start learning in Session 01">Start Session 01</button>
                <button type="button" aria-label="Read the rubrics before starting">Read the rubrics first</button>
              </div>
              <div class="tp-fidelity-notice" hidden></div>
            </div>
            <section class="tp-workspace-card tp-fidelity-card" aria-labelledby="tp-fidelity-card-title">
              <p class="tp-fidelity-card-label">WHAT YOU EARN</p>
              <h2 id="tp-fidelity-card-title">A verifiable credential,<br>not a completion badge</h2>
              <ul>
                <li>Open Badges 3.0 · W3C VC 2.0 · CLR 2.0</li>
                <li>Ed25519 signed · verifiable offline</li>
                <li>Revocable via BitstringStatusList</li>
                <li>Skills mapped to ESCO + Lightcast</li>
                <li>Displayable in Achievement Studio</li>
              </ul>
              <p class="tp-fidelity-card-proof">Credential evidence packet</p>
            </section>
          </div>
        </header>
        <section class="tp-fidelity-proof" aria-labelledby="tp-fidelity-proof-heading">
          <h2 id="tp-fidelity-proof-heading" class="sr-only">Credential at a glance</h2>
          <div class="tp-fidelity-band-inner">
            <div class="tp-fidelity-stat"><div class="tp-fidelity-stat-label">Sessions</div><div class="tp-fidelity-stat-value">12</div><div class="tp-fidelity-stat-meta">one objective, one artifact each</div></div>
            <div class="tp-fidelity-stat"><div class="tp-fidelity-stat-label">Rubric criteria</div><div class="tp-fidelity-stat-value">25</div><div class="tp-fidelity-stat-meta">published before you enrol</div></div>
            <div class="tp-fidelity-stat"><div class="tp-fidelity-stat-label">Contact hours</div><div class="tp-fidelity-stat-value">36</div><div class="tp-fidelity-stat-meta">3 per session, 12 weeks</div></div>
          </div>
        </section>
        <section class="tp-fidelity-pathway" aria-labelledby="tp-fidelity-pathway-heading">
          <div class="tp-fidelity-band-inner">
            <p class="tp-fidelity-section-label">THE PATHWAY</p>
            <h2 id="tp-fidelity-pathway-heading">Twelve sessions, five deliverables</h2>
            <p class="tp-fidelity-section-lede">Each session pairs one learning objective with one artifact you actually build.</p>
            <div class="tp-fidelity-session-grid"></div>
          </div>
        </section>
        <section class="tp-fidelity-standards" aria-labelledby="tp-fidelity-standards-heading">
          <div class="tp-fidelity-band-inner">
            <p class="tp-fidelity-section-label">BUILT ON OPEN STANDARDS</p>
            <h2 id="tp-fidelity-standards-heading" class="tp-fidelity-standard-row">Open Badges 3.0 · W3C VC 2.0 · CLR 2.0 · xAPI 1.0.3 · ESCO + Lightcast</h2>
            <p class="tp-fidelity-section-lede">The credential is signed, verifiable offline, and revocable, and it carries the evidence, not just the claim. Employers and registrars can check it without contacting us.</p>
          </div>
        </section>
        <footer class="tp-fidelity-footer">
          <div class="tp-fidelity-band-inner">
            <p>TeachPlay · AI-enhanced Educational Game Design<br>The University of Alabama, College of Education · teachplay.dev</p>
          </div>
        </footer>
      `;

      const sessionLabels = [
        ['01', 'Framing', 'session-01.html'],
        ['02', 'Objectives', 'session-02.html'],
        ['03', 'Mechanics', 'session-03.html'],
        ['04', 'Prototyping · D3', 'session-04.html', true],
        ['05', 'Playtesting', 'session-05.html'],
        ['06', 'Feedback loops', 'session-06.html'],
        ['07', 'Accessibility', 'session-07.html'],
        ['08', 'Ethics of AI · D4', 'session-08.html', true],
        ['09', 'Cognitive load', 'session-09.html'],
        ['10', 'Calibration', 'session-10.html'],
        ['11', 'Implementation', 'session-11.html'],
        ['12', 'Capstone · D5', 'session-12.html', true],
      ];
      const grid = landing.querySelector('.tp-fidelity-session-grid');
      sessionLabels.forEach(([number, label, href, deliverable]) => {
        const link = document.createElement('a');
        link.className = 'tp-fidelity-session' + (deliverable ? ' is-deliverable' : '');
        link.href = '/' + href;
        link.setAttribute('aria-label', `Open Session ${number}: ${label}`);
        link.innerHTML = `<span><span class="tp-fidelity-session-number">${number}</span><span class="tp-fidelity-session-name">${label}</span></span>`;
        grid.appendChild(link);
      });

      const startButton = landing.querySelector('.tp-fidelity-actions button:first-child');
      startButton?.addEventListener('click', () => {
        const sourceStart = document.querySelector('[data-tp-fidelity-source-start="true"]')
          || [...document.querySelectorAll('.tp-landing-polished button')]
            .find((button) => /Start learning|Review the credential/i.test(normalize(button.textContent))
              || /Start learning/i.test(button.getAttribute('aria-label') || ''));
        sourceStart?.click();
      });
      const rubricButton = landing.querySelector('.tp-fidelity-actions button:last-child');
      rubricButton?.addEventListener('click', () => { window.location.href = '/rubrics.html'; });
      landing.dataset.tpFidelityBuilt = 'true';
    }

    const keep = new Set([nav, brandBar, landing, appShell.querySelector('.tp-canvas-context')]);
    [...appShell.children].forEach((child) => {
      if (!keep.has(child) && child.tagName !== 'BUTTON') child.classList.add('tp-fidelity-legacy');
    });
    const legacyWorkspace = [...appShell.querySelectorAll('.tp-workspace-card')]
      .find((node) => !node.closest('.tp-fidelity-landing'));
    if (legacyWorkspace && legacyWorkspace !== landing.querySelector('.tp-fidelity-card')) {
      legacyWorkspace.classList.remove('tp-workspace-card');
      legacyWorkspace.classList.add('tp-fidelity-legacy-card');
    }
    const legacyStart = [...appShell.querySelectorAll('button')]
      .find((button) => !button.closest('.tp-fidelity-landing')
        && /Start learning|Review the credential/i.test(normalize(button.textContent)));
    if (legacyStart) {
      if (!legacyStart.hasAttribute('data-tp-fidelity-original-aria')) {
        legacyStart.setAttribute('data-tp-fidelity-original-aria', legacyStart.getAttribute('aria-label') || '');
      }
      legacyStart.setAttribute('aria-hidden', 'true');
      legacyStart.setAttribute('tabindex', '-1');
      legacyStart.setAttribute('aria-label', 'Legacy learner entry control');
      legacyStart.setAttribute('data-tp-fidelity-source-start', 'true');
      legacyStart.setAttribute('data-tp-fidelity-hidden-action', 'true');
    }
    hideLegacyStartAction();

    const banner = document.getElementById('tp-presurvey-banner');
    const notice = landing.querySelector('.tp-fidelity-notice');
    if (notice) {
      notice.replaceChildren();
      if (banner) {
        const sourceLink = banner.querySelector('a');
        const text = banner.querySelector('span')?.textContent?.replace(/\s+/g, ' ').trim() || 'Complete the pre-survey before starting Session 01.';
        const copy = document.createElement('span');
        copy.textContent = text;
        notice.appendChild(copy);
        if (sourceLink) {
          const link = document.createElement('a');
          link.href = sourceLink.href;
          link.textContent = ' Open the pre-survey →';
          notice.appendChild(link);
        }
        notice.hidden = false;
        banner.setAttribute('aria-hidden', 'true');
      } else {
        notice.hidden = true;
      }
    }
    // Apply the mode only after the replacement shell exists. This prevents
    // a first-paint gap where the legacy CTA is hidden before its replacement
    // is available to keyboard and pointer users.
    document.body.classList.add('tp-fidelity-mode');
  };

  const update = () => {
    style();
    const root = document.querySelector('#root > div');
    if (!root) return;
    const headingText = normalize([...root.querySelectorAll('h1')].find((element) => normalize(element.textContent))?.textContent);
    // The fidelity shell owns the visible h1, so use the original React hero
    // as the stable route marker instead of whichever h1 happens to appear
    // first after the presentation layer is mounted.
    const isLanding = !!root.querySelector('.tp-landing-polished')
      || headingText === 'Build serious learning games educators can actually defend.';
    const isWorkspace = !isLanding;
    document.body.classList.toggle('tp-learner-landing', isLanding);
    if (!isLanding) resetFidelityLanding();
    if (isLanding) {
      buildFidelityLanding();
      const landingSections = [...document.querySelectorAll('#root section')];
      const mark = (className, pattern) => {
        landingSections.find((section) => pattern.test(normalize(section.textContent)))?.classList.add(className);
      };
      mark('tp-landing-pathway', /Start here: create an account/i);
      mark('tp-landing-assets', /Use the completion guide before starting/i);
      mark('tp-landing-access', /How students access, learn, and submit/i);
      mark('tp-landing-primer', /From objective to mechanic/i);
      mark('tp-landing-curriculum', /embedded 12-module sequence/i);
      mark('tp-landing-standards', /FOR EDUCATOR PD, GRADUATE COURSES, AND CE PROGRAMS/i);
      mark('tp-landing-cta', /Start with the credential pathway/i);
      [...document.querySelectorAll('#root footer')].forEach((footer) => footer.classList.add('tp-landing-footer'));

      const hero = document.querySelector('.tp-landing-polished');
      const stats = document.querySelector('.tp-stat-grid');
      if (hero && stats && !stats.dataset.tpProofMoved) {
        const proof = document.createElement('section');
        proof.className = 'tp-landing-proof-band';
        proof.setAttribute('aria-label', 'Credential at a glance');
        const inner = document.createElement('div');
        inner.className = 'tp-landing-proof-band__inner';
        proof.appendChild(inner);
        inner.appendChild(stats);
        hero.insertAdjacentElement('afterend', proof);
        stats.dataset.tpProofMoved = 'true';
      }

      const workspace = document.querySelector('.tp-workspace-card');
      if (workspace) {
        workspace.querySelectorAll('.tp-workspace-row, .tp-workspace-footer').forEach((node) => {
          node.classList.remove('tp-workspace-row', 'tp-workspace-footer');
        });
        const body = [...workspace.children].find((child) =>
          ['Map the learning problem', 'Prototype with governance', 'Playtest and defend']
            .every((label) => normalize(child.textContent).includes(label))
        );
        if (body) {
          [...body.children].forEach((child) => {
            const text = normalize(child.textContent);
            if (/Map the learning problem|Prototype with governance|Playtest and defend/i.test(text)) {
              child.classList.add('tp-workspace-row');
            }
            if (/Credential evidence packet/i.test(text)) {
              child.classList.add('tp-workspace-footer');
            }
          });
        }
      }
    }
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
  window.addEventListener('tp:layout', schedule);
  const root = document.getElementById('root');
  if (root) new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
})();
