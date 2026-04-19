// nav.js — primary-nav dropdown behavior.
//
// The markup lives in every page (see tools/sync-nav.mjs):
//   <div class="primary-nav__group" data-nav-group>
//     <button class="primary-nav__trigger" aria-expanded="false">…</button>
//     <div class="primary-nav__panel">…</div>
//   </div>
//
// Hover + :focus-within already open panels via CSS. This script adds
// click-to-toggle (for touch + keyboard), outside-click-close, and
// Escape-close. The context-aware CTA ("Register / Resume / View")
// is wired by enroll.js once it knows the learner state.

(function () {
  'use strict';

  function closeAll(except) {
    document.querySelectorAll('[data-nav-group][data-open="true"]').forEach(function (g) {
      if (g !== except) {
        g.removeAttribute('data-open');
        var btn = g.querySelector('.primary-nav__trigger');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function wireGroup(group) {
    var btn = group.querySelector('.primary-nav__trigger');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var isOpen = group.getAttribute('data-open') === 'true';
      closeAll(group);
      if (isOpen) {
        group.removeAttribute('data-open');
        btn.setAttribute('aria-expanded', 'false');
      } else {
        group.setAttribute('data-open', 'true');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  }

  function init() {
    var groups = document.querySelectorAll('[data-nav-group]');
    groups.forEach(wireGroup);

    document.addEventListener('click', function (e) {
      if (!e.target.closest('[data-nav-group]')) closeAll(null);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll(null);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
