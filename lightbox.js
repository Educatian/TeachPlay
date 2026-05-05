// lightbox.js — click-to-zoom for figure images.
//
// Targets:
//   - <img class="asset-figure__img">  (every session-page figure)
//   - <img data-zoomable>              (opt-in for any other image)
//
// On click, opens a full-viewport overlay with the image enlarged
// (max 92vw × 92vh) and the figcaption below if present. Closes on
// backdrop click, the × button, or the Escape key. No dependencies.

(function () {
  'use strict';

  var SELECTOR = 'img.asset-figure__img, img[data-zoomable]';
  var overlay  = null;
  var imgEl    = null;
  var capEl    = null;
  var lastFocus = null;

  function ensureStyles() {
    if (document.getElementById('hb-lightbox-style')) return;
    var s = document.createElement('style');
    s.id = 'hb-lightbox-style';
    s.textContent = [
      '.hb-lightbox-trigger { cursor: zoom-in; transition: opacity .15s; }',
      '.hb-lightbox-trigger:hover { opacity: .92; }',
      '.hb-lightbox {',
      '  position: fixed; inset: 0; z-index: 100000;',
      '  background: rgba(10,10,10,0.92);',
      '  display: flex; flex-direction: column;',
      '  align-items: center; justify-content: center;',
      '  padding: 32px; box-sizing: border-box;',
      '  opacity: 0; transition: opacity .15s ease;',
      '}',
      '.hb-lightbox[data-open="true"] { opacity: 1; }',
      '.hb-lightbox__img {',
      '  max-width: 92vw; max-height: 82vh;',
      '  object-fit: contain;',
      '  background: #fff; border-radius: 4px;',
      '  box-shadow: 0 12px 50px rgba(0,0,0,0.6);',
      '  cursor: zoom-out;',
      '}',
      '.hb-lightbox__cap {',
      '  margin-top: 14px; max-width: 92vw;',
      '  color: #f0eee8; font-size: 14px; line-height: 1.5;',
      '  text-align: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
      '}',
      '.hb-lightbox__close {',
      '  position: absolute; top: 16px; right: 20px;',
      '  background: rgba(255,255,255,0.12); color: #fff;',
      '  border: 1px solid rgba(255,255,255,0.25);',
      '  width: 38px; height: 38px; border-radius: 50%;',
      '  font-size: 22px; line-height: 1; cursor: pointer;',
      '  display: flex; align-items: center; justify-content: center;',
      '}',
      '.hb-lightbox__close:hover { background: rgba(255,255,255,0.22); }',
    ].join('\n');
    document.head.appendChild(s);
  }

  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'hb-lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Enlarged image');

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'hb-lightbox__close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '&times;';

    imgEl = document.createElement('img');
    imgEl.className = 'hb-lightbox__img';
    imgEl.alt = '';

    capEl = document.createElement('div');
    capEl.className = 'hb-lightbox__cap';

    overlay.appendChild(closeBtn);
    overlay.appendChild(imgEl);
    overlay.appendChild(capEl);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      // Click on backdrop (not on the image itself) closes; image click also closes.
      if (e.target === overlay || e.target === imgEl || e.target === closeBtn) close();
    });
  }

  function captionFor(img) {
    var fig = img.closest && img.closest('figure');
    if (!fig) return '';
    var fc = fig.querySelector('figcaption');
    return fc ? fc.textContent.trim() : '';
  }

  function open(img) {
    if (!overlay) buildOverlay();
    imgEl.src = img.currentSrc || img.src;
    imgEl.alt = img.alt || '';
    var cap = captionFor(img);
    capEl.textContent = cap;
    capEl.style.display = cap ? '' : 'none';
    lastFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    // Trigger CSS transition.
    requestAnimationFrame(function () { overlay.setAttribute('data-open', 'true'); });
  }

  function close() {
    if (!overlay || overlay.getAttribute('data-open') !== 'true') return;
    overlay.removeAttribute('data-open');
    document.body.style.overflow = '';
    setTimeout(function () { if (imgEl) imgEl.src = ''; }, 200);
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (_) {} }
  }

  function wire(img) {
    if (img.dataset.lbWired) return;
    img.dataset.lbWired = '1';
    img.classList.add('hb-lightbox-trigger');
    img.addEventListener('click', function () { open(img); });
  }

  function scan(root) {
    (root || document).querySelectorAll(SELECTOR).forEach(wire);
  }

  function init() {
    ensureStyles();
    scan(document);

    // Pick up images injected after page load (e.g. via shell.js/quiz.js).
    var mo = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes && m.addedNodes.forEach(function (n) {
          if (n.nodeType !== 1) return;
          if (n.matches && n.matches(SELECTOR)) wire(n);
          if (n.querySelectorAll) scan(n);
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.hbLightbox = { open: open, close: close, scan: scan };
})();
