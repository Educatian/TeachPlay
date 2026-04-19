// enroll.js — enrollment modal + fine-grained learning-event capture.
//
// Depends on xapi.js being loaded first (for window.xapi, though not strictly
// required — all /api/xapi calls here are independent fire-and-forget fetches).
// Reads/writes localStorage key 'hb:learner_id'.

(function () {
  'use strict';

  const LEARNER_KEY = 'hb:learner_id';
  const COHORT      = '2026-spring';

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function xapiPost(payload) {
    fetch('/api/xapi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    // fire-and-forget — intentionally no await / .catch
  }

  // Derive "s01", "s02", … from the current pathname, or null if not a session page.
  function sessionId() {
    const m = location.pathname.match(/session-(\d+)/i);
    return m ? 's' + m[1].padStart(2, '0') : null;
  }

  // ── Core tracking logic ──────────────────────────────────────────────────────

  function startTracking(learnerId) {
    // Expose learner id so xapi.js flush can attach X-Learner-ID header.
    window._hb_learner_id = learnerId;

    const sid = sessionId();
    if (!sid) return; // not on a session page — nothing more to track

    const activityId   = 'session/' + sid;
    const activityType = 'session';

    // (a) Session start — once per tab load (sessionStorage guard)
    const startKey = 'hb:started:' + sid;
    if (!sessionStorage.getItem(startKey)) {
      sessionStorage.setItem(startKey, '1');
      xapiPost({ learner_id: learnerId, verb: 'started', activity_id: activityId, activity_type: activityType });
    }

    // (b) Active-time heartbeat every 60 s, paused while tab is hidden
    let heartbeatTimer = null;

    function startHeartbeat() {
      if (heartbeatTimer) return;
      heartbeatTimer = setInterval(function () {
        if (!document.hidden) {
          xapiPost({ learner_id: learnerId, verb: 'heartbeat', activity_id: activityId, activity_type: activityType });
        }
      }, 60000);
    }

    function stopHeartbeat() {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
    }

    if (!document.hidden) startHeartbeat();

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stopHeartbeat();
      } else {
        startHeartbeat();
      }
    });

    // (c) Section visibility — .block[id] elements, ≥40% visible for ≥2 s
    const viewedSections = new Set();
    const pendingTimers  = new Map(); // elementId → setTimeout handle

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        const sectionId = entry.target.id;
        if (!sectionId || viewedSections.has(sectionId)) return;

        if (entry.intersectionRatio >= 0.4) {
          // Start 2-second dwell timer
          if (!pendingTimers.has(sectionId)) {
            const timer = setTimeout(function () {
              pendingTimers.delete(sectionId);
              if (viewedSections.has(sectionId)) return; // double-check
              viewedSections.add(sectionId);
              xapiPost({
                learner_id:    learnerId,
                verb:          'viewed',
                activity_id:   'section/' + sid + '/' + sectionId,
                activity_type: 'section',
              });
            }, 2000);
            pendingTimers.set(sectionId, timer);
          }
        } else {
          // Left viewport — cancel pending timer
          if (pendingTimers.has(sectionId)) {
            clearTimeout(pendingTimers.get(sectionId));
            pendingTimers.delete(sectionId);
          }
        }
      });
    }, { threshold: 0.4 });

    document.querySelectorAll('.block[id]').forEach(function (el) {
      observer.observe(el);
    });

    // (d) xapi.js bridge — already set above; also update in case xapi.js reads
    //     it lazily. Nothing more needed; flush() reads localStorage directly.
  }

  // ── Enrollment modal ─────────────────────────────────────────────────────────

  function removeModal(overlay) {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  function showModal() {
    const overlay = document.createElement('div');
    overlay.id = 'hb-enroll-overlay';
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:99999',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'background:rgba(0,0,0,0.55)',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
    ].join(';');

    overlay.innerHTML = [
      '<div style="',
        'background:#fff;',
        'border-radius:10px;',
        'box-shadow:0 8px 40px rgba(0,0,0,0.28);',
        'max-width:420px;',
        'width:calc(100% - 40px);',
        'padding:36px 32px 28px;',
        'position:relative;',
      '">',

        // Brand accent bar
        '<div style="',
          'height:5px;',
          'background:#be1a2f;',
          'border-radius:4px;',
          'margin-bottom:24px;',
        '"></div>',

        // Title
        '<h2 style="',
          'margin:0 0 8px;',
          'font-size:1.25rem;',
          'font-weight:700;',
          'color:#1a1a1a;',
        '">Register to track your progress</h2>',

        // Subtitle
        '<p style="',
          'margin:0 0 24px;',
          'font-size:0.9rem;',
          'color:#555;',
          'line-height:1.5;',
        '">Your progress will be saved to your account so you can resume on any device.</p>',

        // Form
        '<form id="hb-enroll-form" novalidate>',

          // Name field
          '<label style="display:block;margin-bottom:14px;">',
            '<span style="display:block;font-size:0.82rem;font-weight:600;color:#333;margin-bottom:4px;">Full name</span>',
            '<input id="hb-enroll-name" type="text" placeholder="Jane Smith" autocomplete="name" style="',
              'width:100%;',
              'box-sizing:border-box;',
              'padding:9px 12px;',
              'border:1px solid #ccc;',
              'border-radius:6px;',
              'font-size:0.95rem;',
              'outline:none;',
              'transition:border-color .15s;',
            '" required />',
          '</label>',

          // Email field
          '<label style="display:block;margin-bottom:20px;">',
            '<span style="display:block;font-size:0.82rem;font-weight:600;color:#333;margin-bottom:4px;">Email address</span>',
            '<input id="hb-enroll-email" type="email" placeholder="jane@university.edu" autocomplete="email" style="',
              'width:100%;',
              'box-sizing:border-box;',
              'padding:9px 12px;',
              'border:1px solid #ccc;',
              'border-radius:6px;',
              'font-size:0.95rem;',
              'outline:none;',
              'transition:border-color .15s;',
            '" required />',
          '</label>',

          // Error area
          '<p id="hb-enroll-error" role="alert" style="',
            'display:none;',
            'color:#be1a2f;',
            'font-size:0.85rem;',
            'margin:0 0 14px;',
          '"></p>',

          // Submit button
          '<button type="submit" id="hb-enroll-btn" style="',
            'display:block;',
            'width:100%;',
            'padding:11px;',
            'background:#be1a2f;',
            'color:#fff;',
            'border:none;',
            'border-radius:6px;',
            'font-size:1rem;',
            'font-weight:600;',
            'cursor:pointer;',
            'transition:background .15s;',
          '">Enroll \u2192</button>',

        '</form>',

        // Skip link
        '<p style="text-align:center;margin:16px 0 0;">',
          '<a id="hb-enroll-skip" href="#" style="',
            'font-size:0.82rem;',
            'color:#777;',
            'text-decoration:underline;',
            'cursor:pointer;',
          '">Skip for now</a>',
        '</p>',

      '</div>',
    ].join('');

    document.body.appendChild(overlay);

    // Focus first field
    var nameInput = document.getElementById('hb-enroll-name');
    if (nameInput) setTimeout(function () { nameInput.focus(); }, 50);

    // Skip link
    document.getElementById('hb-enroll-skip').addEventListener('click', function (e) {
      e.preventDefault();
      removeModal(overlay);
    });

    // Hover effect on button
    var btn = document.getElementById('hb-enroll-btn');
    btn.addEventListener('mouseover', function () { btn.style.background = '#9c1526'; });
    btn.addEventListener('mouseout',  function () { btn.style.background = '#be1a2f'; });

    // Form submit
    document.getElementById('hb-enroll-form').addEventListener('submit', function (e) {
      e.preventDefault();

      var name  = (document.getElementById('hb-enroll-name').value  || '').trim();
      var email = (document.getElementById('hb-enroll-email').value || '').trim();
      var errorEl = document.getElementById('hb-enroll-error');

      function showError(msg) {
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
      }

      if (!name)  { showError('Please enter your full name.'); return; }
      if (!email) { showError('Please enter your email address.'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('Please enter a valid email address.');
        return;
      }

      errorEl.style.display = 'none';
      btn.disabled    = true;
      btn.textContent = 'Enrolling\u2026';

      fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, cohort: COHORT }),
      })
        .then(function (resp) {
          if (!resp.ok) {
            return resp.text().then(function (t) {
              throw new Error(t || ('Server error ' + resp.status));
            });
          }
          return resp.json();
        })
        .then(function (data) {
          var learnerId = data.learner_id;
          if (!learnerId) throw new Error('No learner_id in response.');
          localStorage.setItem(LEARNER_KEY, learnerId);
          removeModal(overlay);
          startTracking(learnerId);
        })
        .catch(function (err) {
          btn.disabled    = false;
          btn.textContent = 'Enroll \u2192';
          showError(err.message || 'Something went wrong. Please try again.');
        });
    });
  }

  // ── Entry point ──────────────────────────────────────────────────────────────

  function init() {
    var learnerId = localStorage.getItem(LEARNER_KEY);
    if (learnerId) {
      startTracking(learnerId);
    } else {
      showModal();
    }
  }

  // Run after DOM is interactive
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
