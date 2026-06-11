// teachplay-search-inject.js — surface the handbook search inside the React SPA.
//
// The root index.html and /app/index.html are the same React shell: the app
// renders its own header into #root, so there is no static
// <form class="site-header__search"> for search.js to wire (unlike the static
// handbook/session pages). This script injects a self-contained, fixed search
// pill OUTSIDE #root (so it survives React re-renders), then loads /search.js,
// which auto-wires any form.site-header__search and owns the results dropdown.
// The index is fetched from the absolute /search-index.json.
(() => {
  'use strict';
  if (window.__tpAppSearchInjected) return;
  window.__tpAppSearchInjected = true;

  function injectStyles() {
    if (document.getElementById('tp-app-search-style')) return;
    const s = document.createElement('style');
    s.id = 'tp-app-search-style';
    s.textContent = [
      // top is set dynamically (below the React header) by positionPill();
      // the 76px here is only the pre-measure fallback.
      '#tp-app-search { position: fixed; top: 76px; right: 14px; z-index: 9990; }',
      '#tp-app-search .site-header__search {',
      '  display: flex; align-items: center; gap: 4px;',
      '  background: #fff; border: 1px solid #d9d4cc; border-radius: 999px;',
      '  padding: 4px 6px 4px 12px; box-shadow: 0 4px 14px rgba(16,24,40,.12);',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
      '}',
      '#tp-app-search input[type="search"] {',
      '  border: 0; outline: 0; background: transparent;',
      '  font-size: 14px; color: #1a1a1a; width: 168px; padding: 4px 0;',
      '}',
      '#tp-app-search input[type="search"]::placeholder { color: #8a8378; }',
      '#tp-app-search input[type="search"]::-webkit-search-cancel-button { cursor: pointer; }',
      '#tp-app-search .site-header__search-btn {',
      '  border: 0; background: #be1a2f; color: #fff; cursor: pointer;',
      '  width: 30px; height: 30px; border-radius: 50%; font-size: 14px;',
      '  display: flex; align-items: center; justify-content: center; flex: 0 0 auto;',
      '}',
      '#tp-app-search .site-header__search-btn:hover { background: #9c1526; }',
      '#tp-app-search .site-header__search:focus-within {',
      '  border-color: #be1a2f;',
      '  box-shadow: 0 0 0 3px rgba(190,26,47,.18), 0 4px 14px rgba(16,24,40,.12);',
      '}',
      '@media (max-width: 720px) {',
      '  #tp-app-search { right: 8px; }',
      '  #tp-app-search input[type="search"] { width: 112px; }',
      '}',
      '@media print { #tp-app-search { display: none; } }',
    ].join('\n');
    document.head.appendChild(s);
  }

  // The pill must NEVER sit on top of the React header's own controls (the
  // Sign in button lives at the header's top-right and a fixed top:12px pill
  // covered it on narrower laptop viewports — field-reported). So we park the
  // pill just BELOW the header, and below the pre-survey banner when that is
  // showing. Re-measured on resize, on tp:layout (banner mount/dismiss), and
  // on a few delayed ticks while React mounts.
  function positionPill() {
    const wrap = document.getElementById('tp-app-search');
    if (!wrap) return;
    let top = 76; // fallback ≈ header height + gap
    const header = document.querySelector('#root header') || document.querySelector('header');
    if (header) {
      const r = header.getBoundingClientRect();
      if (r.height > 0 && r.bottom > 0 && r.bottom < 220) top = Math.round(r.bottom) + 10;
    }
    const banner = document.getElementById('tp-presurvey-banner');
    if (banner) {
      const b = banner.getBoundingClientRect();
      if (b.height > 0 && b.bottom > top - 10) top = Math.round(b.bottom) + 10;
    }
    wrap.style.top = top + 'px';
  }

  function watchLayout() {
    [400, 1200, 2600].forEach((ms) => setTimeout(positionPill, ms));
    window.addEventListener('resize', positionPill);
    window.addEventListener('tp:layout', positionPill);
  }

  function inject() {
    if (document.getElementById('tp-app-search')) return;
    injectStyles();
    const wrap = document.createElement('div');
    wrap.id = 'tp-app-search';
    wrap.innerHTML =
      '<form class="site-header__search" role="search" onsubmit="return false;">' +
        '<input type="search" placeholder="Search the handbook…" ' +
          'aria-label="Search the handbook" autocomplete="off" />' +
        '<button type="submit" class="site-header__search-btn" aria-label="Search">🔍</button>' +
      '</form>';
    document.body.appendChild(wrap);
    positionPill();
    watchLayout();

    // Load the shared search engine once. If it is somehow already present,
    // re-run its (idempotent) wiring so it picks up this freshly-injected form.
    if (window.hbSearchInit) {
      window.hbSearchInit();
    } else if (!document.querySelector('script[data-tp-search]')) {
      const sc = document.createElement('script');
      sc.src = '/search.js';
      sc.defer = true;
      sc.setAttribute('data-tp-search', '1');
      document.body.appendChild(sc);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
