// hero-type.js — typewriter reveal for the hero headline.
//
// Marks up: <h1 ... data-typewriter> ... </h1>
//
// Walks every text node inside the element in document order, blanks them,
// then reveals characters one-at-a-time across all nodes so inline tags
// (<br>, <em>) keep working naturally. Adds a blinking caret span at the
// end which the CSS animates. Plays once per page load (sessionStorage
// guard so it doesn't replay on intra-tab nav).

(function () {
  'use strict';

  var SPEED_MS = 55;       // per character
  var INITIAL_PAUSE = 250; // ms before typing starts

  function injectStyles() {
    if (document.getElementById('hb-typewriter-style')) return;
    var s = document.createElement('style');
    s.id = 'hb-typewriter-style';
    s.textContent = [
      '[data-typewriter] { min-height: 1.92em; }',
      '.hb-caret {',
      '  display: inline-block; width: 0.06em;',
      '  background: currentColor; color: inherit;',
      '  margin-left: 0.04em; vertical-align: -0.08em;',
      '  height: 0.92em;',
      '  animation: hb-caret-blink 1s steps(1) infinite;',
      '}',
      '@keyframes hb-caret-blink {',
      '  50% { opacity: 0; }',
      '}',
      '[data-typewriter][data-done="true"] .hb-caret { animation: hb-caret-blink 1.3s steps(1) infinite; }',
    ].join('\n');
    document.head.appendChild(s);
  }

  function collectTextNodes(root) {
    var nodes = [];
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n;
    while ((n = walker.nextNode())) {
      if (n.nodeValue && n.nodeValue.length) nodes.push(n);
    }
    return nodes;
  }

  function play(el) {
    var textNodes = collectTextNodes(el);
    if (!textNodes.length) return;

    // Capture originals + blank everything
    var originals = textNodes.map(function (tn) { return tn.nodeValue; });
    textNodes.forEach(function (tn) { tn.nodeValue = ''; });

    // Append caret
    var caret = document.createElement('span');
    caret.className = 'hb-caret';
    caret.setAttribute('aria-hidden', 'true');
    el.appendChild(caret);

    var idx = 0, charIdx = 0;
    function tick() {
      if (idx >= textNodes.length) {
        el.setAttribute('data-done', 'true');
        return;
      }
      var orig = originals[idx];
      if (charIdx < orig.length) {
        textNodes[idx].nodeValue = orig.slice(0, charIdx + 1);
        charIdx++;
        setTimeout(tick, SPEED_MS);
      } else {
        idx++;
        charIdx = 0;
        setTimeout(tick, SPEED_MS);
      }
    }
    setTimeout(tick, INITIAL_PAUSE);
  }

  function init() {
    // Respect prefers-reduced-motion: present the headline statically.
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var els = document.querySelectorAll('[data-typewriter]');
      els.forEach(function (el) { el.setAttribute('data-done', 'true'); });
      return;
    }
    injectStyles();
    var els = document.querySelectorAll('[data-typewriter]');
    els.forEach(play);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
