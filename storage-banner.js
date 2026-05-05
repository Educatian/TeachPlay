// storage-banner.js — first-visit notice about local storage usage.
//
// Edu-tech credibility: a learner whose progress is being tracked deserves
// to see what's collected before they invest. This banner shows once,
// briefly, until dismissed. Dismissal persists; clearing site data brings
// the banner back, which is the correct behavior under FERPA-ish norms.

(function () {
  'use strict';

  var KEY = 'hb:storage-acknowledged';

  function ack() {
    try { return localStorage.getItem(KEY) === '1'; } catch (_) { return true; }
  }
  function setAck() {
    try { localStorage.setItem(KEY, '1'); } catch (_) {}
  }

  function injectStyles() {
    if (document.getElementById('hb-storage-style')) return;
    var s = document.createElement('style');
    s.id = 'hb-storage-style';
    s.textContent = [
      '.hb-storage-banner {',
      '  position: fixed; bottom: 16px; right: 16px;',
      '  max-width: 380px; z-index: 99996;',
      '  background: #1a1a1a; color: #fff;',
      '  border-left: 4px solid #be1a2f;',
      '  padding: 14px 18px;',
      '  border-radius: 8px;',
      '  box-shadow: 0 12px 32px rgba(0,0,0,0.32);',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
      '  font-size: 13px; line-height: 1.5;',
      '  transform: translateY(20px); opacity: 0;',
      '  transition: opacity .25s ease, transform .25s ease;',
      '}',
      '.hb-storage-banner.is-on { transform: translateY(0); opacity: 1; }',
      '.hb-storage-banner__title {',
      '  font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;',
      '  color: #f0c44a; font-weight: 700; margin-bottom: 6px;',
      '}',
      '.hb-storage-banner__body { color: #e8e8e8; margin: 0 0 10px; }',
      '.hb-storage-banner__body a { color: #f0c44a; text-decoration: underline; }',
      '.hb-storage-banner__actions { display: flex; gap: 8px; }',
      '.hb-storage-banner__actions button, .hb-storage-banner__actions a.btn-link {',
      '  background: #be1a2f; color: #fff; border: 0;',
      '  padding: 7px 14px; border-radius: 5px; cursor: pointer;',
      '  font-size: 12px; font-weight: 600; text-decoration: none;',
      '  font-family: inherit;',
      '}',
      '.hb-storage-banner__actions button:hover { background: #9c1526; }',
      '.hb-storage-banner__actions a.btn-link {',
      '  background: transparent; border: 1px solid rgba(255,255,255,0.3);',
      '  display: inline-flex; align-items: center;',
      '}',
      '.hb-storage-banner__actions a.btn-link:hover { background: rgba(255,255,255,0.1); }',
      '@media (max-width: 600px) {',
      '  .hb-storage-banner { left: 16px; right: 16px; max-width: none; bottom: 12px; }',
      '}',
      '@media print { .hb-storage-banner { display: none !important; } }',
    ].join('\n');
    document.head.appendChild(s);
  }

  function show() {
    injectStyles();
    var b = document.createElement('div');
    b.className = 'hb-storage-banner';
    b.setAttribute('role', 'status');
    b.innerHTML =
      '<div class="hb-storage-banner__title">Local-only storage</div>' +
      '<p class="hb-storage-banner__body">' +
        'Your highlights, achievements, and progress live in this browser only. ' +
        'No cookies, no third-party trackers. Read the full ' +
        '<a href="privacy.html">privacy notice</a>.' +
      '</p>' +
      '<div class="hb-storage-banner__actions">' +
        '<button type="button" data-act="ok">Got it</button>' +
        '<a class="btn-link" href="privacy.html">Privacy details →</a>' +
      '</div>';
    document.body.appendChild(b);
    requestAnimationFrame(function () { b.classList.add('is-on'); });
    b.querySelector('[data-act="ok"]').addEventListener('click', function () {
      setAck();
      b.classList.remove('is-on');
      setTimeout(function () { b.remove(); }, 280);
    });
  }

  function init() {
    if (ack()) return;
    // Don't blast it on the privacy page itself — they're already there.
    if (/privacy\.html/.test(location.pathname)) { setAck(); return; }
    // Tiny delay so the banner doesn't compete with first-paint.
    setTimeout(show, 1200);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
