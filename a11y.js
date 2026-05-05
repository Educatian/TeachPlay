// a11y.js — shared accessibility plumbing for every page.
//
// Two things, both injected at DOMContentLoaded so individual page markup
// doesn't have to import them:
//
// 1. **Skip-to-content link** — visually hidden until keyboard focus, then
//    appears at the top of the page. Targets `<main id="main">` or, if no
//    <main>, the first <section> after the site-header.
// 2. **Footer accessibility / privacy links** — appended into every
//    `.site-footer` row so accessibility.html and privacy.html are
//    discoverable from anywhere on the site.

(function () {
  'use strict';

  function injectStyles() {
    if (document.getElementById('hb-a11y-style')) return;
    var s = document.createElement('style');
    s.id = 'hb-a11y-style';
    s.textContent = [
      '.hb-skip {',
      '  position: absolute; top: -40px; left: 12px;',
      '  background: #1a1a1a; color: #fff;',
      '  padding: 8px 14px; border-radius: 0 0 6px 6px;',
      '  font-size: 13px; font-weight: 600;',
      '  text-decoration: none; z-index: 100100;',
      '  transition: top .15s ease;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
      '}',
      '.hb-skip:focus { top: 0; outline: 3px solid #be1a2f; outline-offset: 0; }',
      '.hb-footer-meta-links { display: flex; flex-wrap: wrap; gap: 14px; font-size: 12px; margin-top: 8px; }',
      '.hb-footer-meta-links a { color: rgba(255,255,255,0.85); text-decoration: none; border-bottom: 1px solid rgba(255,255,255,0.25); }',
      '.hb-footer-meta-links a:hover { color: #fff; border-bottom-color: #fff; }',
    ].join('\n');
    document.head.appendChild(s);
  }

  function ensureSkipLink() {
    if (document.querySelector('.hb-skip')) return;
    // Find a sensible target: <main id="main">, or first <section>, or <body>.
    var target = document.getElementById('main');
    if (!target) target = document.querySelector('main');
    if (!target) target = document.querySelector('section');
    if (!target) target = document.body;
    if (target && !target.id) target.id = 'main';
    var a = document.createElement('a');
    a.className = 'hb-skip';
    a.href = '#' + (target ? target.id : 'main');
    a.textContent = 'Skip to main content';
    document.body.insertBefore(a, document.body.firstChild);
  }

  function ensureFooterLinks() {
    var footer = document.querySelector('.site-footer');
    if (!footer) return;
    if (footer.querySelector('.hb-footer-meta-links')) return;
    var row = document.createElement('div');
    row.className = 'hb-footer-meta-links';
    row.innerHTML =
      '<a href="accessibility.html">Accessibility</a>' +
      '<a href="privacy.html">Privacy &amp; data</a>' +
      '<a href="https://github.com/Educatian/TeachPlay" target="_blank" rel="noopener">Source</a>';
    // Try to append into the metadata cell that already names the institution
    var metaCell = footer.querySelectorAll('.site-footer__meta');
    var lastMeta = metaCell[metaCell.length - 1];
    if (lastMeta) lastMeta.appendChild(row);
    else footer.appendChild(row);
  }

  function init() {
    injectStyles();
    ensureSkipLink();
    ensureFooterLinks();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
