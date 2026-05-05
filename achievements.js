// achievements.js — light gameful layer over existing handbook actions.
//
// Listens for events the page is already producing (session opens, text
// highlights, game-card visits, scroll-to-end) and unlocks named
// achievements. Each unlock pops a toast and persists in localStorage.
// A "🏆 N/M" badge in the utility bar opens a small list panel.
//
// Achievements are intentionally low-friction — they reward what learners
// already do (read, annotate, browse examples) rather than gating content.

(function () {
  'use strict';

  var KEY = 'hb:achievements';
  var SEEN_GAME_KEY = 'hb:games-clicked';

  var ACHIEVEMENTS = [
    { id: 'first_session',  emoji: '🎯', title: 'First Session',     desc: 'You opened your first handbook session.' },
    { id: 'three_sessions', emoji: '🏃', title: 'Building Momentum', desc: 'Three sessions in. The loop is forming.' },
    { id: 'all_sessions',   emoji: '🏆', title: 'Credential-Ready',  desc: 'You opened all twelve sessions.' },
    { id: 'first_highlight', emoji: '🖍', title: 'Annotator',         desc: 'Your first highlight is on the page.' },
    { id: 'five_highlights', emoji: '📚', title: 'Margin Reader',     desc: 'Five highlights across the handbook.' },
    { id: 'first_note',      emoji: '📝', title: 'Note-Taker',        desc: 'You added a note to a highlight.' },
    { id: 'curator',         emoji: '🎮', title: 'Curator',           desc: 'Visited five game examples.' },
    { id: 'spec_finisher',   emoji: '📐', title: 'Spec Finisher',     desc: 'Opened the implementation spec (Session 12).' },
    { id: 'easter_konami',   emoji: '🥚', title: 'Konami',            desc: '↑↑↓↓←→←→ B A — you know your roots.' },
  ];

  // ─── Storage ─────────────────────────────────────────────────
  function unlocked() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch (_) { return []; }
  }
  function setUnlocked(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (_) {}
  }
  function isUnlocked(id) { return unlocked().indexOf(id) !== -1; }
  function unlock(id) {
    if (isUnlocked(id)) return;
    var spec = ACHIEVEMENTS.filter(function (a) { return a.id === id; })[0];
    if (!spec) return;
    var arr = unlocked(); arr.push(id); setUnlocked(arr);
    toast(spec);
    refreshBadge();
  }

  // ─── Toast UI ────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('hb-ach-style')) return;
    var s = document.createElement('style'); s.id = 'hb-ach-style';
    s.textContent = [
      '.hb-ach-toast {',
      '  position: fixed; bottom: 24px; right: 24px;',
      '  background: #1a1a1a; color: #fff;',
      '  border-left: 4px solid #f0c44a;',
      '  padding: 14px 18px 14px 16px;',
      '  border-radius: 8px;',
      '  box-shadow: 0 12px 32px rgba(0,0,0,0.32);',
      '  display: flex; gap: 12px; align-items: center;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
      '  z-index: 100003;',
      '  transform: translateY(20px); opacity: 0;',
      '  transition: transform .3s ease, opacity .3s ease;',
      '  max-width: 340px;',
      '}',
      '.hb-ach-toast.is-open { transform: translateY(0); opacity: 1; }',
      '.hb-ach-toast__emoji { font-size: 32px; line-height: 1; }',
      '.hb-ach-toast__body { flex: 1; min-width: 0; }',
      '.hb-ach-toast__eye  { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #f0c44a; margin-bottom: 2px; }',
      '.hb-ach-toast__title { font-size: 14px; font-weight: 700; line-height: 1.2; }',
      '.hb-ach-toast__desc  { font-size: 12px; opacity: 0.85; margin-top: 3px; line-height: 1.4; }',

      '.hb-ach-badge {',
      '  display: inline-flex; align-items: center; gap: 4px;',
      '  font-size: 12px;',
      '}',

      '.hb-ach-panel {',
      '  position: fixed; top: 0; right: 0; bottom: 0;',
      '  width: 320px; max-width: 88vw;',
      '  background: #fff; border-left: 1px solid #e0ddd8;',
      '  box-shadow: -8px 0 30px rgba(0,0,0,0.12);',
      '  display: flex; flex-direction: column;',
      '  transform: translateX(100%); transition: transform .25s ease;',
      '  z-index: 99999;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
      '}',
      '.hb-ach-panel.is-open { transform: translateX(0); }',
      '.hb-ach-panel__head {',
      '  display: flex; align-items: center; justify-content: space-between;',
      '  padding: 14px 18px; border-bottom: 1px solid #e0ddd8;',
      '  background: #1a1a1a; color: #fff;',
      '}',
      '.hb-ach-panel__close { background: transparent; color: #fff; border: 0; font-size: 22px; cursor: pointer; line-height: 1; }',
      '.hb-ach-panel__list { flex: 1; overflow-y: auto; padding: 12px 18px 24px; }',
      '.hb-ach-row { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px dashed #eee; }',
      '.hb-ach-row__emoji { font-size: 24px; line-height: 1; opacity: 0.4; }',
      '.hb-ach-row.is-on .hb-ach-row__emoji { opacity: 1; }',
      '.hb-ach-row__title { font-size: 13px; font-weight: 700; color: #1a1a1a; }',
      '.hb-ach-row.is-off .hb-ach-row__title { color: #aaa; }',
      '.hb-ach-row__desc  { font-size: 12px; color: #666; margin-top: 2px; }',
    ].join('\n');
    document.head.appendChild(s);
  }

  function toast(spec) {
    injectStyles();
    var el = document.createElement('div');
    el.className = 'hb-ach-toast';
    el.innerHTML =
      '<div class="hb-ach-toast__emoji">' + spec.emoji + '</div>' +
      '<div class="hb-ach-toast__body">' +
        '<div class="hb-ach-toast__eye">Achievement unlocked</div>' +
        '<div class="hb-ach-toast__title">' + spec.title + '</div>' +
        '<div class="hb-ach-toast__desc">' + spec.desc + '</div>' +
      '</div>';
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('is-open'); });
    setTimeout(function () {
      el.classList.remove('is-open');
      setTimeout(function () { el.remove(); }, 350);
    }, 4200);
  }

  // ─── Badge + panel in utility bar ────────────────────────────
  var badge = null, panel = null;
  function ensureBadge() {
    if (badge) return badge;
    var slot = document.querySelector('.utility__right');
    if (!slot) return null;
    var a = document.createElement('a');
    a.href = '#'; a.id = 'hb-ach-toggle'; a.className = 'hb-ach-badge';
    a.innerHTML = '🏆 <span data-count>0/' + ACHIEVEMENTS.length + '</span>';
    a.addEventListener('click', function (e) { e.preventDefault(); togglePanel(); });
    slot.insertBefore(a, slot.firstChild);
    badge = a;
    return badge;
  }
  function refreshBadge() {
    ensureBadge();
    if (!badge) return;
    var c = badge.querySelector('[data-count]');
    if (c) c.textContent = unlocked().length + '/' + ACHIEVEMENTS.length;
  }
  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement('aside');
    panel.className = 'hb-ach-panel';
    panel.innerHTML =
      '<div class="hb-ach-panel__head">' +
        '<strong>Achievements</strong>' +
        '<button class="hb-ach-panel__close" aria-label="Close">×</button>' +
      '</div>' +
      '<div class="hb-ach-panel__list" id="hb-ach-list"></div>';
    document.body.appendChild(panel);
    panel.querySelector('.hb-ach-panel__close').onclick = function () { panel.classList.remove('is-open'); };
    return panel;
  }
  function togglePanel() {
    ensurePanel();
    panel.classList.toggle('is-open');
    if (panel.classList.contains('is-open')) renderList();
  }
  function renderList() {
    var list = document.getElementById('hb-ach-list');
    if (!list) return;
    var u = unlocked();
    list.innerHTML = ACHIEVEMENTS.map(function (a) {
      var on = u.indexOf(a.id) !== -1;
      return '<div class="hb-ach-row ' + (on ? 'is-on' : 'is-off') + '">' +
        '<div class="hb-ach-row__emoji">' + (on ? a.emoji : '🔒') + '</div>' +
        '<div><div class="hb-ach-row__title">' + a.title + '</div>' +
        '<div class="hb-ach-row__desc">' + a.desc + '</div></div></div>';
    }).join('');
  }

  // ─── Event hooks ─────────────────────────────────────────────
  function trackSessionVisit() {
    var m = location.pathname.match(/session-(\d+)/);
    if (!m) return;
    var sid = 's' + m[1].padStart(2, '0');
    var key = 'hb:visited:' + sid;
    var visitedAlready = !!localStorage.getItem(key);
    if (!visitedAlready) localStorage.setItem(key, '1');

    var visited = 0;
    for (var i = 1; i <= 12; i++) {
      if (localStorage.getItem('hb:visited:s' + String(i).padStart(2, '0'))) visited++;
    }
    if (visited >= 1) unlock('first_session');
    if (visited >= 3) unlock('three_sessions');
    if (visited >= 12) unlock('all_sessions');
    if (sid === 's12') unlock('spec_finisher');
  }

  function trackHighlights() {
    function check() {
      try {
        var arr = JSON.parse(localStorage.getItem('hb:annotations') || '[]');
        if (arr.length >= 1) unlock('first_highlight');
        if (arr.length >= 5) unlock('five_highlights');
        var withNote = arr.filter(function (a) { return a.note && a.note.trim(); });
        if (withNote.length >= 1) unlock('first_note');
      } catch (_) {}
    }
    // Re-check on storage change (this tab only — we trigger after own writes)
    var origSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      origSet.apply(this, arguments);
      if (k === 'hb:annotations') setTimeout(check, 0);
    };
    check();
  }

  function trackGameCardVisits() {
    document.addEventListener('click', function (e) {
      var card = e.target.closest && e.target.closest('a.showcase-card');
      if (!card) return;
      try {
        var seen = JSON.parse(localStorage.getItem(SEEN_GAME_KEY) || '[]');
        var key = card.getAttribute('href') || card.textContent.trim().slice(0, 40);
        if (seen.indexOf(key) === -1) seen.push(key);
        localStorage.setItem(SEEN_GAME_KEY, JSON.stringify(seen));
        if (seen.length >= 5) unlock('curator');
      } catch (_) {}
    });
  }

  function trackKonami() {
    var seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    var pos = 0;
    document.addEventListener('keydown', function (e) {
      var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === seq[pos]) {
        pos++;
        if (pos === seq.length) { unlock('easter_konami'); pos = 0; }
      } else {
        pos = (k === seq[0]) ? 1 : 0;
      }
    });
  }

  // ─── Boot ────────────────────────────────────────────────────
  function init() {
    injectStyles();
    refreshBadge();
    trackSessionVisit();
    trackHighlights();
    trackGameCardVisits();
    trackKonami();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.hbAchievements = {
    unlocked: unlocked,
    all: function () { return ACHIEVEMENTS.slice(); },
    unlock: unlock,
    open: function () { ensurePanel(); panel.classList.add('is-open'); renderList(); },
  };
})();
