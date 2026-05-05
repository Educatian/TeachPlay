// search.js — instant client-side search over the prebuilt index.
//
// Wires every page's <form class="site-header__search"> input to a
// dropdown of ranked results. Index lives at /search-index.json and is
// fetched lazily on first focus (28 pages, ~135 KB once).
//
// Scoring (per page, summed over query tokens):
//   title match     5
//   heading match   3
//   description     2
//   body            1
// Multi-token queries are AND-style: every token must hit somewhere on the
// page for it to qualify, then scores sum. Empty/whitespace queries reset.

(function () {
  'use strict';

  var INDEX_URL = 'search-index.json';
  var indexPromise = null;
  function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch(INDEX_URL)
        .then(function (r) { return r.ok ? r.json() : []; })
        .catch(function () { return []; });
    }
    return indexPromise;
  }

  function tokenize(s) {
    return (s || '')
      .toLowerCase()
      .split(/[^a-z0-9가-힣]+/i)
      .filter(function (t) { return t.length >= 2; });
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function highlight(text, tokens) {
    if (!tokens.length) return escapeHtml(text);
    var safe = escapeHtml(text);
    var pat = new RegExp('(' + tokens.map(function (t) {
      return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('|') + ')', 'gi');
    return safe.replace(pat, '<mark>$1</mark>');
  }

  function snippet(body, tokens, len) {
    if (!body) return '';
    if (!tokens.length) return body.slice(0, len);
    // Find earliest token hit, center the snippet around it.
    var lower = body.toLowerCase();
    var first = -1;
    tokens.forEach(function (t) {
      var i = lower.indexOf(t);
      if (i !== -1 && (first === -1 || i < first)) first = i;
    });
    if (first === -1) return body.slice(0, len);
    var start = Math.max(0, first - 60);
    var end   = Math.min(body.length, start + len);
    var prefix = start > 0 ? '… ' : '';
    var suffix = end < body.length ? ' …' : '';
    return prefix + body.slice(start, end) + suffix;
  }

  function rank(index, query) {
    var tokens = tokenize(query);
    if (!tokens.length) return [];
    var hits = [];
    for (var i = 0; i < index.length; i++) {
      var p = index[i];
      var score = 0;
      var titleLow   = (p.title || '').toLowerCase();
      var descLow    = (p.description || '').toLowerCase();
      var bodyLow    = (p.body || '').toLowerCase();
      var headingLow = (p.headings || []).join(' \n ').toLowerCase();
      var figureLow  = (p.figures  || []).join(' \n ').toLowerCase();
      var matchedAll = true;
      for (var k = 0; k < tokens.length; k++) {
        var t = tokens[k];
        var hit = false;
        if (titleLow.indexOf(t)   !== -1) { score += 5; hit = true; }
        if (headingLow.indexOf(t) !== -1) { score += 3; hit = true; }
        if (figureLow.indexOf(t)  !== -1) { score += 2.5; hit = true; }
        if (descLow.indexOf(t)    !== -1) { score += 2; hit = true; }
        if (bodyLow.indexOf(t)    !== -1) { score += 1; hit = true; }
        if (!hit) { matchedAll = false; break; }
      }
      if (matchedAll) hits.push({ page: p, score: score });
    }
    hits.sort(function (a, b) { return b.score - a.score; });
    return hits.slice(0, 8).map(function (h) { return h.page; });
  }

  function injectStyles() {
    if (document.getElementById('hb-search-style')) return;
    var s = document.createElement('style');
    s.id = 'hb-search-style';
    s.textContent = [
      '.hb-search-results {',
      '  position: absolute; top: calc(100% + 6px); right: 0;',
      '  width: min(520px, 96vw);',
      '  background: #fff; border: 1px solid #e0ddd8; border-radius: 8px;',
      '  box-shadow: 0 12px 32px rgba(0,0,0,0.16);',
      '  z-index: 9998;',
      '  max-height: 70vh; overflow-y: auto;',
      '  display: none;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
      '}',
      '.hb-search-results.is-open { display: block; }',
      '.hb-search-row {',
      '  display: block; padding: 12px 16px;',
      '  border-bottom: 1px solid #f0ede8;',
      '  text-decoration: none; color: inherit;',
      '  cursor: pointer;',
      '}',
      '.hb-search-row:last-child { border-bottom: 0; }',
      '.hb-search-row:hover { background: #faf9f7; }',
      '.hb-search-row.is-active {',
      '  background: #fff7e6;',
      '  box-shadow: inset 4px 0 0 var(--crimson, #be1a2f);',
      '}',
      '.hb-search-row:focus-visible {',
      '  outline: 2px solid var(--crimson, #be1a2f);',
      '  outline-offset: -2px;',
      '}',
      '.hb-search-row__title { font-size: 14px; font-weight: 700; color: #1a1a1a; line-height: 1.3; }',
      '.hb-search-row__url   { font-size: 11px; color: #be1a2f; margin-top: 2px; font-family: var(--font-mono, monospace); }',
      '.hb-search-row__snip  { font-size: 12.5px; color: #555; margin-top: 4px; line-height: 1.45; }',
      '.hb-search-row mark   { background: #ffe98a; padding: 0 1px; border-radius: 2px; color: inherit; }',
      '.hb-search-empty, .hb-search-meta {',
      '  padding: 14px 18px; font-size: 13px; color: #888;',
      '  text-align: center;',
      '}',
      '.site-header__search { position: relative; }',
    ].join('\n');
    document.head.appendChild(s);
  }

  function render(form, results, tokens) {
    var panel = form.querySelector('.hb-search-results');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'hb-search-results';
      panel.setAttribute('role', 'listbox');
      form.appendChild(panel);
    }
    if (!results.length) {
      panel.innerHTML = '<div class="hb-search-empty">No matches.</div>';
    } else {
      panel.innerHTML = results.map(function (p, i) {
        var snip = snippet(p.body, tokens, 180);
        return '<a class="hb-search-row" data-idx="' + i + '" href="' + p.url + '" role="option">' +
          '<div class="hb-search-row__title">' + highlight(p.title || p.url, tokens) + '</div>' +
          '<div class="hb-search-row__url">' + p.url + '</div>' +
          (snip ? '<div class="hb-search-row__snip">' + highlight(snip, tokens) + '</div>' : '') +
        '</a>';
      }).join('');
    }
    panel.classList.add('is-open');
    return panel;
  }

  function close(form) {
    var panel = form.querySelector('.hb-search-results');
    if (panel) panel.classList.remove('is-open');
  }

  function wire(form) {
    if (!form || form.dataset.hbSearchWired) return;
    form.dataset.hbSearchWired = '1';
    injectStyles();

    var input = form.querySelector('input[type="search"], input[type="text"]');
    if (!input) return;
    // The form already has onsubmit="return false;" — keep that, but we hijack
    // the input events to drive the dropdown.

    var debounceT = null;
    var lastTokens = [];
    var activeIdx = -1;

    function update() {
      var q = input.value.trim();
      if (!q) { close(form); return; }
      loadIndex().then(function (idx) {
        var results = rank(idx, q);
        lastTokens = tokenize(q);
        activeIdx = -1;
        render(form, results, lastTokens);
      });
    }
    input.addEventListener('input', function () {
      clearTimeout(debounceT);
      debounceT = setTimeout(update, 100);
    });
    input.addEventListener('focus', function () {
      // Pre-warm the index on first focus.
      loadIndex();
      if (input.value.trim()) update();
    });
    input.addEventListener('keydown', function (e) {
      var panel = form.querySelector('.hb-search-results');
      if (!panel || !panel.classList.contains('is-open')) return;
      var rows = panel.querySelectorAll('.hb-search-row');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIdx = Math.min(rows.length - 1, activeIdx + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIdx = Math.max(-1, activeIdx - 1);
      } else if (e.key === 'Enter') {
        if (activeIdx >= 0 && rows[activeIdx]) {
          e.preventDefault();
          window.location.href = rows[activeIdx].getAttribute('href');
        }
      } else if (e.key === 'Escape') {
        close(form);
        input.blur();
      }
      rows.forEach(function (r, i) { r.classList.toggle('is-active', i === activeIdx); });
      // Scroll the active row into view inside the panel (long lists)
      if (activeIdx >= 0 && rows[activeIdx]) {
        rows[activeIdx].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });

    document.addEventListener('click', function (e) {
      if (!form.contains(e.target)) close(form);
    });
  }

  function init() {
    document.querySelectorAll('form.site-header__search').forEach(wire);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
