// storage-banner.js — first-visit notice about local storage usage.
//
// Edu-tech credibility: a learner whose progress is being tracked deserves
// to see what's collected before they invest. This banner shows once,
// briefly, until dismissed. Dismissal persists; clearing site data brings
// the banner back, which is the correct behavior under FERPA-ish norms.

(function () {
  'use strict';

  var KEY = 'hb:storage-acknowledged';
  var SNOOZE_KEY = 'hb:storage-banner-snoozed';

  function ack() {
    try { return localStorage.getItem(KEY) === '1'; } catch (_) { return true; }
  }
  function setAck() {
    try { localStorage.setItem(KEY, '1'); } catch (_) {}
  }
  // Scroll-away dismissal hides the banner for this tab session only —
  // it does NOT acknowledge; the banner returns on the next session.
  function snoozed() {
    try { return sessionStorage.getItem(SNOOZE_KEY) === '1'; } catch (_) { return false; }
  }
  function setSnoozed() {
    try { sessionStorage.setItem(SNOOZE_KEY, '1'); } catch (_) {}
  }

  function injectStyles() {
    if (document.getElementById('hb-storage-style')) return;
    var s = document.createElement('style');
    s.id = 'hb-storage-style';
    s.textContent = [
      // The banner element itself is the card — keep its footprint small so
      // it never blankets the footer session nav, and keep its z-index below
      // the achievement toast (100003) but above back-to-top (99997) so
      // neither the toast corner-stacking nor the back-to-top button can
      // cover the "Got it" action.
      '.hb-storage-banner {',
      '  position: fixed; bottom: 16px; right: 16px;',
      '  max-width: 360px; z-index: 99998;',
      '  background: #1a1a1a !important; color: #fff !important;',
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
      // font-size/line-height pinned — the pages\' global `p` rule (17px)
      // otherwise overrides the inherited banner size and bloats the card.
      '.hb-storage-banner__body { color: #e8e8e8 !important; margin: 0 0 10px; font-size: inherit; line-height: inherit; font-family: inherit; }',
      '.hb-storage-banner__body a { color: #f5d783 !important; text-decoration: underline; }',
      '.hb-storage-banner__actions { display: flex; gap: 8px; }',
      '.hb-storage-banner__actions button, .hb-storage-banner__actions a.btn-link {',
      '  background: #9e1b32 !important; color: #fff !important; border: 0;',
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
      // Mobile: a slim full-width bottom bar (≤72px) with the actions inline,
      // instead of a tall stacked card that buries the footer nav.
      '@media (max-width: 600px) {',
      '  .hb-storage-banner {',
      '    left: 0; right: 0; bottom: 0; max-width: none;',
      '    max-height: 72px; overflow: hidden;',
      '    border-radius: 0; padding: 8px 12px;',
      '    display: flex; align-items: center; gap: 10px;',
      '    font-size: 11px; line-height: 1.3;',
      '  }',
      '  .hb-storage-banner__title { display: none; }',
      '  .hb-storage-banner__extra { display: none; }',
      '  .hb-storage-banner__body { margin: 0; flex: 1; min-width: 0; }',
      '  .hb-storage-banner__actions { flex-shrink: 0; }',
      '  .hb-storage-banner__actions a.btn-link { display: none; }',
      '}',
      // While the banner is open, lift the achievement toast (same corner,
      // higher z-index) above it so the toast never sits on "Got it".
      'html.hb-storage-banner-open .hb-ach-toast { bottom: var(--hb-banner-clearance, 190px) !important; }',
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
        '<span class="hb-storage-banner__extra">No cookies, no third-party trackers. </span>' +
        'Read the full <a href="privacy.html">privacy notice</a>.' +
      '</p>' +
      '<div class="hb-storage-banner__actions">' +
        '<button type="button" data-act="ok">Got it</button>' +
        '<a class="btn-link" href="privacy.html">Privacy details →</a>' +
      '</div>';
    document.body.appendChild(b);
    document.documentElement.classList.add('hb-storage-banner-open');
    document.documentElement.style.setProperty(
      '--hb-banner-clearance', (b.offsetHeight + 28) + 'px');
    requestAnimationFrame(function () { b.classList.add('is-on'); });

    function dismiss() {
      window.removeEventListener('scroll', onScroll);
      document.documentElement.classList.remove('hb-storage-banner-open');
      b.classList.remove('is-on');
      setTimeout(function () { b.remove(); }, 280);
    }

    b.querySelector('[data-act="ok"]').addEventListener('click', function () {
      setAck();
      dismiss();
    });

    // Auto-dismiss (session snooze only — deliberately NOT setAck) once the
    // learner scrolls past 60% of the page: by then they're reading, and the
    // banner must not sit on top of the footer prev/next session nav.
    function onScroll() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      if (window.scrollY / max >= 0.6) {
        setSnoozed();
        dismiss();
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function init() {
    if (ack() || snoozed()) return;
    // Don't blast it on the privacy page itself — they're already there.
    if (/privacy\.html/.test(location.pathname)) { setAck(); return; }
    // Tiny delay so the banner doesn't compete with first-paint. If the
    // enroll modal is up (first visit to a session page), hold the banner
    // until the modal is dismissed so interruptions arrive one at a time.
    setTimeout(function () {
      if (document.getElementById('hb-enroll-overlay')) {
        document.addEventListener('hb:enroll-close', function () {
          setTimeout(show, 600);
        }, { once: true });
        return;
      }
      show();
    }, 1200);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
