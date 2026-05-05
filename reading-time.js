// reading-time.js — small, auto-injected "~N min read" estimate.
//
// Counts words in the page's main reading region (.content, .hb-prose, or
// the first <section> after the hero) and renders an unobtrusive crimson
// pill near the page's intro. ~220 wpm reading rate, rounded up.
//
// No-op on pages where the main reading region is too short (< 300 words),
// since for short utility pages a reading estimate is noise.

(function () {
  'use strict';

  // Two reading rates:
  //   220 wpm — average native-English adult silent reading
  //   140 wpm — typical ESL / second-language reading rate (Carver, 1990;
  //              Brantmeier, 2005). UA cohorts include international
  //              students; surface both estimates so they can self-pace.
  var WPM_NATIVE = 220;
  var WPM_ESL = 140;
  var MIN_WORDS = 300;

  function injectStyles() {
    if (document.getElementById('hb-rtime-style')) return;
    var s = document.createElement('style'); s.id = 'hb-rtime-style';
    s.textContent = [
      '.hb-rtime {',
      '  display: inline-flex; align-items: center; gap: 6px;',
      '  background: rgba(255,255,255,0.12);',
      '  border: 1px solid rgba(255,255,255,0.25);',
      '  color: rgba(255,255,255,0.92);',
      '  padding: 4px 10px; border-radius: 999px;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
      '  font-size: 11px; font-weight: 600;',
      '  letter-spacing: 0.04em; text-transform: uppercase;',
      '  vertical-align: middle;',
      '}',
      '.hb-rtime svg { width: 12px; height: 12px; }',
      // Light-background variants (anywhere we attach inside a .session-header etc.)
      '.session-header .hb-rtime, .content .hb-rtime {',
      '  background: #fafaf7; color: #be1a2f;',
      '  border-color: #e8e6e2;',
      '}',
      '@media print { .hb-rtime { display: none !important; } }',
    ].join('\n');
    document.head.appendChild(s);
  }

  function pickReadingRegion() {
    return document.querySelector('main .content')
        || document.querySelector('.content')
        || document.querySelector('.hb-prose')
        || document.querySelector('main')
        || null;
  }

  function pickInsertSlot() {
    // Priority order — match the page conventions we've established.
    return document.querySelector('.session-header__crumbs')
        || document.querySelector('.hero__eyebrow')
        || document.querySelector('.section__eyebrow')
        || null;
  }

  function countWords(root) {
    if (!root) return 0;
    // Use innerText so hidden + script/style are excluded automatically.
    var txt = (root.innerText || root.textContent || '').trim();
    if (!txt) return 0;
    // Split on Unicode whitespace; collapse multiple. Asian-script-aware
    // counting is overkill — this is a casual estimate.
    return txt.split(/\s+/).length;
  }

  function buildPill(nativeMins, eslMins) {
    var span = document.createElement('span');
    span.className = 'hb-rtime';
    var label = '~' + nativeMins + ' min (native) · ~' + eslMins + ' min (ESL)';
    span.setAttribute('aria-label', 'Estimated reading time: ' + label);
    span.title = 'Native English reader: ~' + nativeMins + ' min · Second-language reader: ~' + eslMins + ' min';
    span.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="9"></circle>' +
        '<polyline points="12 7 12 12 15 14"></polyline>' +
      '</svg>' +
      '<span>~' + nativeMins + '–' + eslMins + ' min read</span>';
    return span;
  }

  function init() {
    injectStyles();
    var region = pickReadingRegion();
    if (!region) return;
    var words = countWords(region);
    if (words < MIN_WORDS) return;
    var nativeMins = Math.max(1, Math.ceil(words / WPM_NATIVE));
    var eslMins = Math.max(1, Math.ceil(words / WPM_ESL));
    var slot = pickInsertSlot();
    if (!slot) return;
    var pill = buildPill(nativeMins, eslMins);
    // Append next to the eyebrow / crumbs so it visually belongs to the heading
    slot.appendChild(document.createTextNode(' '));
    slot.appendChild(pill);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
