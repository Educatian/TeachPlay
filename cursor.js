// cursor.js — game-style custom cursor.
//
// Renders two elements that follow the mouse:
//   - a small crimson dot pinned exactly to the pointer
//   - a larger ring that lags behind with spring-easing
//
// On hover over an interactive element (links, buttons, cards, the
// hero typewriter, figure images), the ring inflates and shifts color.
// On click, a quick ripple expands and fades.
//
// Hides the native cursor while our cursor is active; preserves text
// cursor inside form fields. Disabled on:
//   - touch-only devices (no hover)
//   - viewports under 720px wide
//   - users with prefers-reduced-motion: reduce
//   - the localStorage opt-out 'hb:cursor-off' (so people who hate it
//     can do `localStorage.setItem('hb:cursor-off','1')` and reload)

(function () {
  'use strict';

  if (window.matchMedia('(hover: none)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 720) return;
  try { if (localStorage.getItem('hb:cursor-off') === '1') return; } catch (_) {}

  // Interactive selector — these elements get the "hover-pop" ring style.
  var INTERACTIVE = [
    'a', 'button',
    '[role="button"]', '[role="menuitem"]',
    '.btn', '.card', '.session-card', '.deliverable',
    '.showcase-card', '.video-card',
    '.primary-nav__trigger', '.primary-nav__cta',
    '[data-nav-group]', '[data-typewriter]',
    'img.asset-figure__img', 'img[data-zoomable]',
    'input', 'textarea', 'select',
  ].join(', ');

  // Text-input selector — keep the native I-beam visible inside these.
  var TEXT_INPUT = 'input, textarea, [contenteditable="true"]';

  function injectStyles() {
    var s = document.createElement('style');
    s.id = 'hb-cursor-style';
    s.textContent = [
      'body.hb-cursor-on, body.hb-cursor-on * { cursor: none !important; }',
      // Keep native I-beam where typing happens.
      'body.hb-cursor-on input, body.hb-cursor-on textarea, body.hb-cursor-on [contenteditable="true"] { cursor: text !important; }',
      // Iframes own their own cursor; let them.
      'body.hb-cursor-on iframe { cursor: auto !important; }',

      '.hb-cursor-dot, .hb-cursor-ring {',
      '  position: fixed; top: 0; left: 0;',
      '  pointer-events: none;',
      '  z-index: 100001;',
      '  transform: translate3d(-100px, -100px, 0);',
      '  will-change: transform;',
      '  border-radius: 50%;',
      '}',
      '.hb-cursor-dot {',
      '  width: 8px; height: 8px;',
      '  background: #be1a2f;',
      '  margin: -4px 0 0 -4px;',
      '  box-shadow: 0 0 6px rgba(190,26,47,0.6);',
      '  transition: opacity .15s, transform .05s linear;',
      '}',
      '.hb-cursor-ring {',
      '  width: 36px; height: 36px;',
      '  margin: -18px 0 0 -18px;',
      '  border: 2px solid rgba(190,26,47,0.55);',
      '  background: rgba(190,26,47,0.04);',
      '  transition: width .18s ease, height .18s ease, margin .18s ease,',
      '              border-color .18s ease, background-color .18s ease,',
      '              opacity .15s ease;',
      '}',
      // Hover state (over interactive elements)
      '.hb-cursor-ring.is-hover {',
      '  width: 56px; height: 56px;',
      '  margin: -28px 0 0 -28px;',
      '  border-color: #be1a2f;',
      '  background: rgba(190,26,47,0.10);',
      '}',
      // Hidden when off-window
      '.hb-cursor-dot.is-hidden, .hb-cursor-ring.is-hidden { opacity: 0; }',

      // Click ripple
      '.hb-cursor-ripple {',
      '  position: fixed; top: 0; left: 0;',
      '  pointer-events: none; z-index: 100000;',
      '  width: 18px; height: 18px;',
      '  margin: -9px 0 0 -9px;',
      '  border-radius: 50%;',
      '  border: 2px solid rgba(190,26,47,0.7);',
      '  animation: hb-cursor-ripple-anim .55s ease-out forwards;',
      '}',
      '@keyframes hb-cursor-ripple-anim {',
      '  0%   { transform: scale(0.4); opacity: 0.9; }',
      '  100% { transform: scale(3.4); opacity: 0; }',
      '}',
    ].join('\n');
    document.head.appendChild(s);
  }

  function build() {
    injectStyles();
    var dot  = document.createElement('div'); dot.className  = 'hb-cursor-dot';
    var ring = document.createElement('div'); ring.className = 'hb-cursor-ring';
    document.body.appendChild(ring);
    document.body.appendChild(dot);
    document.body.classList.add('hb-cursor-on');
    return { dot: dot, ring: ring };
  }

  function init() {
    var els = build();
    var dot = els.dot, ring = els.ring;

    // Target = exact mouse position. Ring lerps toward target each frame.
    var tx = -100, ty = -100;       // target (mouse)
    var rx = -100, ry = -100;       // ring (lagged)
    var EASE = 0.22;

    document.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0)';
      // Hover detection
      var t = e.target;
      var hit = t && t.closest && t.closest(INTERACTIVE);
      var isText = t && t.closest && t.closest(TEXT_INPUT);
      if (hit && !isText) ring.classList.add('is-hover');
      else ring.classList.remove('is-hover');
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      dot.classList.add('is-hidden'); ring.classList.add('is-hidden');
    });
    document.addEventListener('mouseenter', function () {
      dot.classList.remove('is-hidden'); ring.classList.remove('is-hidden');
    });

    document.addEventListener('mousedown', function (e) {
      var rip = document.createElement('div');
      rip.className = 'hb-cursor-ripple';
      rip.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0)';
      document.body.appendChild(rip);
      setTimeout(function () { rip.remove(); }, 600);
      // Quick "press" tightening on the ring
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0) scale(0.78)';
      setTimeout(function () {
        ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      }, 150);
    });

    function tick() {
      rx += (tx - rx) * EASE;
      ry += (ty - ry) * EASE;
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // Public escape hatch
    window.hbCursor = {
      off: function () {
        try { localStorage.setItem('hb:cursor-off', '1'); } catch (_) {}
        document.body.classList.remove('hb-cursor-on');
        dot.remove(); ring.remove();
      },
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
