// admin-gate.js — code-gated entry to admin.html for test/preview.
//
// Wired by index.html (and any page that includes the trigger):
//   <a href="#" id="admin-gate-trigger">Admin</a>
//
// On click: prompts for an access code. If it matches CODE, sets the
// instructor role + a one-shot test flag and redirects to admin.html?test=1.
// admin.html reads the query param and bypasses the ISSUER_API_KEY gate,
// rendering its dashboard against built-in demo data so the UI is testable
// without a real key. To view live data, open admin.html directly and paste
// the real ISSUER_API_KEY.

(function () {
  'use strict';
  var CODE = 'immersivebama';

  function attach() {
    var btn = document.getElementById('admin-gate-trigger');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var entered = window.prompt('Enter admin access code:');
      if (entered == null) return;
      if (entered.trim().toLowerCase() === CODE) {
        try {
          localStorage.setItem('hb:role', 'instructor');
          localStorage.setItem('hb:admin-test', '1');
        } catch (_) {}
        window.location.href = 'admin.html?test=1';
      } else {
        window.alert('Invalid code.');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();
