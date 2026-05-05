// back-to-top.js — floating "↑ Top" button that appears on long pages.
//
// Auto-injects a fixed-position button bottom-left (kept clear of the
// achievement toast slot bottom-right). Becomes visible after scrolling
// past 600 px and smooth-scrolls to the top on click. Hidden on touch
// devices and when prefers-reduced-motion (use the keyboard or the
// browser's native scroll-to-top instead).

(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function injectStyles() {
    if (document.getElementById('hb-totop-style')) return;
    var s = document.createElement('style'); s.id = 'hb-totop-style';
    s.textContent = [
      '.hb-totop {',
      '  position: fixed; bottom: 24px; left: 24px;',
      '  width: 44px; height: 44px;',
      '  border-radius: 50%;',
      '  background: #be1a2f; color: #fff;',
      '  border: 0; cursor: pointer;',
      '  font-size: 20px; line-height: 1;',
      '  box-shadow: 0 6px 20px rgba(190, 26, 47, 0.35);',
      '  display: flex; align-items: center; justify-content: center;',
      '  opacity: 0; transform: translateY(8px);',
      '  pointer-events: none;',
      '  transition: opacity .2s ease, transform .2s ease, background-color .15s;',
      '  z-index: 99997;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
      '}',
      '.hb-totop.is-on { opacity: 1; transform: translateY(0); pointer-events: auto; }',
      '.hb-totop:hover { background: #9c1526; }',
      '.hb-totop:focus-visible { outline: 3px solid rgba(190,26,47,0.4); outline-offset: 2px; }',
      '@media (max-width: 720px) { .hb-totop { bottom: 16px; left: 16px; width: 40px; height: 40px; } }',
    ].join('\n');
    document.head.appendChild(s);
  }

  function init() {
    injectStyles();
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hb-totop';
    btn.setAttribute('aria-label', 'Back to top');
    btn.title = 'Back to top';
    btn.innerHTML = '↑';
    document.body.appendChild(btn);

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        if (window.scrollY > 600) btn.classList.add('is-on');
        else btn.classList.remove('is-on');
        ticking = false;
      });
    }
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
