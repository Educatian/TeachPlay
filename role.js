// role.js — Student / Instructor role toggle.
//
// Writes localStorage['hb:role'] ∈ {'student','instructor'}. Sets
// document.body.dataset.role at DOMContentLoaded so CSS rules
//   body[data-role="student"]    .instructor-only { display: none; }
//   body[data-role="instructor"] .student-only    { display: none; }
// can toggle both nav links and inline panels. Renders a small pill-style
// switch into any <div data-role-switch></div> mount point — typically the
// utility bar.
//
// This is a *reference-implementation* role gate. It hides UI but does not
// block direct URL access. For a real deployment, pair with LTI 1.3 role
// claims (see docs/L2-lti-1.3-design.md) or an SSO layer.

(function () {
  const KEY = 'hb:role';

  function getRole() {
    const v = localStorage.getItem(KEY);
    return v === 'instructor' ? 'instructor' : 'student';
  }

  function setRole(r) {
    const role = r === 'instructor' ? 'instructor' : 'student';
    localStorage.setItem(KEY, role);
    applyRole(role);
    document.dispatchEvent(new CustomEvent('hb:role-changed', { detail: { role } }));
  }

  function applyRole(role) {
    document.body.dataset.role = role;
    document.querySelectorAll('[data-role-switch] [data-role-btn]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.roleBtn === role);
      btn.setAttribute('aria-pressed', btn.dataset.roleBtn === role);
    });
  }

  function renderSwitch(mount) {
    mount.innerHTML = `
      <div class="role-switch" role="group" aria-label="Role">
        <span class="role-switch__label">View as</span>
        <button type="button" class="role-switch__btn" data-role-btn="student"    aria-pressed="false">Student</button>
        <button type="button" class="role-switch__btn" data-role-btn="instructor" aria-pressed="false">Instructor</button>
      </div>
    `;
    mount.querySelectorAll('[data-role-btn]').forEach(btn => {
      btn.addEventListener('click', () => setRole(btn.dataset.roleBtn));
    });
  }

  // ── Boot ──────────────────────────────────────────────────
  function init() {
    const role = getRole();
    document.body.dataset.role = role;
    document.querySelectorAll('[data-role-switch]').forEach(renderSwitch);
    applyRole(role);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.hbRole = { getRole, setRole };
})();
