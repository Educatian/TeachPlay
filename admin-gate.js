// admin-gate.js — code-gated "preview as learner" mode.
//
// Wired by index.html (and any page that includes the trigger):
//   <a href="#" id="admin-gate-trigger">Admin</a>
//
// On click:
//   - If admin mode is OFF: prompt for the access code. If it matches CODE,
//     plant a synthetic learner_id + admin flag in localStorage so enroll.js
//     skips the registration modal. Drop the user into session-01.html so
//     they can immediately walk through the 12-session module flow as if
//     enrolled — without polluting real telemetry (xapi.js + enroll.js
//     short-circuit /api/xapi when 'hb:admin' is set).
//   - If admin mode is ON: clear the flags (sign out of preview).
//
// The link label flips between "Admin" and "Exit admin" so the current
// state is visible.

(function () {
  'use strict';
  var CODE         = 'immersivebama';
  var ADMIN_KEY    = 'hb:admin';
  var LEARNER_KEY  = 'hb:learner_id';
  var ROLE_KEY     = 'hb:role';
  var PREVIEW_ID   = 'admin-preview';

  function isAdmin() {
    try { return localStorage.getItem(ADMIN_KEY) === '1'; } catch (_) { return false; }
  }

  function enterAdmin() {
    try {
      localStorage.setItem(ADMIN_KEY, '1');
      localStorage.setItem(ROLE_KEY, 'instructor');
      // Plant a synthetic learner so enroll.js init() skips the modal and
      // wirePrimaryCta() shows the correct "Begin / Resume Session NN" CTA.
      if (!localStorage.getItem(LEARNER_KEY)) {
        localStorage.setItem(LEARNER_KEY, PREVIEW_ID);
      }
    } catch (_) {}
  }

  function exitAdmin() {
    try {
      localStorage.removeItem(ADMIN_KEY);
      // Only clear the learner id if it's the synthetic one — don't blow
      // away a real enrollment that happened to coexist.
      if (localStorage.getItem(LEARNER_KEY) === PREVIEW_ID) {
        localStorage.removeItem(LEARNER_KEY);
      }
      // Reset role to student so instructor-only nav re-hides.
      localStorage.setItem(ROLE_KEY, 'student');
    } catch (_) {}
  }

  function refreshLabel(btn) {
    btn.textContent = isAdmin() ? 'Exit admin' : 'Admin';
    btn.title = isAdmin()
      ? 'Currently previewing as admin — click to exit'
      : 'Enter admin access code';
  }

  function attach() {
    var btn = document.getElementById('admin-gate-trigger');
    if (!btn) return;
    refreshLabel(btn);

    btn.addEventListener('click', function (e) {
      e.preventDefault();

      if (isAdmin()) {
        if (!window.confirm('Exit admin preview mode?')) return;
        exitAdmin();
        refreshLabel(btn);
        // Reload so enroll.js / role.js re-init in clean state.
        window.location.reload();
        return;
      }

      var entered = window.prompt('Enter admin access code:');
      if (entered == null) return;
      if (entered.trim().toLowerCase() !== CODE) {
        window.alert('Invalid code.');
        return;
      }
      enterAdmin();
      // Land on Session 01 so the user can immediately walk the module.
      window.location.href = 'session-01.html';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }

  // Expose for callers / debugging.
  window.hbAdmin = { isAdmin: isAdmin, enter: enterAdmin, exit: exitAdmin };
})();
