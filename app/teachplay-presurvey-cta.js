// teachplay-presurvey-cta.js — surface the PRE consent/start survey in the SPA.
//
// The consent pre-survey was previously only reachable as a banner on the
// static start.html / session-XX.html pages (survey-gate-ui.js); learners who
// live in the React shell at / had no path to it at all (field-reported:
// "unable to locate the pre-survey"). This script renders a slim fixed bar
// just below the React header, OUTSIDE #root so React re-renders can't wipe
// it:
//   - signed-in learner, consent gate ACTIVE and not completed → crimson
//     "complete the pre-survey" bar linking to the signed Qualtrics link
//     from /api/survey-link?type=consent (session-dismissable; reappears
//     next visit until the Worker records completion);
//   - no learner in this browser → a quieter, permanently dismissable hint
//     telling enrolled learners to sign in to receive their pre-survey;
//   - gate inactive or consent already recorded → renders nothing.
// If the browser has a learner_id but no token (the pre-fix SPA discarded
// it), we silently re-enroll with the stored email — /api/enroll is
// idempotent and returns the row's session_token — then proceed.
(() => {
  'use strict';
  if (window.__tpPresurveyCta) return;
  window.__tpPresurveyCta = true;

  const get = (k) => { try { return localStorage.getItem(k) || ''; } catch (_) { return ''; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };

  const HINT_DISMISS_KEY = 'tp:presurvey-hint-dismissed';
  let sessionDismissed = false;
  try { sessionDismissed = sessionStorage.getItem('tp:presurvey-bar-dismissed') === '1'; } catch (_) {}

  function headerBottom() {
    const header = document.querySelector('#root header') || document.querySelector('header');
    if (header) {
      const r = header.getBoundingClientRect();
      if (r.height > 0 && r.bottom > 0 && r.bottom < 220) return Math.round(r.bottom);
    }
    return 64;
  }

  function pingLayout() {
    try { window.dispatchEvent(new CustomEvent('tp:layout')) } catch (_) {}
  }

  function removeBanner() {
    const old = document.getElementById('tp-presurvey-banner');
    if (old) { old.remove(); pingLayout(); }
  }

  function renderBanner({ strong, message, ctaLabel, ctaHref, onDismiss }) {
    removeBanner();
    const bar = document.createElement('div');
    bar.id = 'tp-presurvey-banner';
    bar.setAttribute('role', 'status');
    bar.style.cssText =
      'position:fixed;left:0;right:0;z-index:9985;' +
      'top:' + (headerBottom()) + 'px;' +
      'display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;' +
      'padding:10px 48px 10px 16px;background:#fff7e6;border-bottom:2px solid #be1a2f;' +
      'box-shadow:0 4px 14px rgba(16,24,40,.10);' +
      'font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;color:#1a1a1a;text-align:center;';
    const msg = document.createElement('span');
    msg.innerHTML = (strong ? '<strong>' + strong + '</strong> ' : '') + message;
    bar.appendChild(msg);
    if (ctaLabel && ctaHref) {
      const a = document.createElement('a');
      a.href = ctaHref;
      a.textContent = ctaLabel;
      a.style.cssText =
        'display:inline-block;background:#be1a2f;color:#fff;text-decoration:none;' +
        'padding:7px 16px;border-radius:999px;font-weight:600;font-size:13.5px;white-space:nowrap;';
      bar.appendChild(a);
    }
    const x = document.createElement('button');
    x.type = 'button';
    x.setAttribute('aria-label', 'Dismiss');
    x.textContent = '×';
    x.style.cssText =
      'position:absolute;right:10px;top:50%;transform:translateY(-50%);' +
      'border:0;background:transparent;font-size:20px;line-height:1;cursor:pointer;color:#6b6157;padding:4px 8px;';
    x.addEventListener('click', () => { removeBanner(); if (onDismiss) onDismiss(); });
    bar.appendChild(x);
    document.body.appendChild(bar);
    // header may still be settling while React mounts — re-pin a few times
    const repin = () => { bar.style.top = headerBottom() + 'px'; pingLayout(); };
    [400, 1200, 2600].forEach((ms) => setTimeout(repin, ms));
    window.addEventListener('resize', repin);
    pingLayout();
  }

  function api(path, lid, token) {
    return fetch(path, {
      headers: { 'X-Learner-Token': token || '', 'X-Learner-ID': lid },
    }).then((r) => r.json());
  }

  // Pre-fix SPA sign-ins stored learner_id but discarded the session token.
  // /api/enroll is idempotent per email and returns the row's token, so a
  // silent re-enroll with the stored email restores an authenticated session.
  function ensureToken(lid) {
    const token = get('hb:learner_token');
    if (token) return Promise.resolve(token);
    const email = get('hb:learner_email') || get('tp:pending-learner-email');
    if (!email) return Promise.resolve('');
    const name = get('hb:learner_name') || get('tp:pending-learner-name') || email.split('@')[0];
    return fetch('/api/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, email: email, cohort: '2026-spring' }),
    }).then((r) => r.json()).then((d) => {
      if (!d || !d.ok || !d.session_token) return '';
      set('hb:learner_id', d.learner_id);
      set('hb:learner_token', d.session_token);
      return d.session_token;
    }).catch(() => '');
  }

  function showAnonymousHint() {
    if (get(HINT_DISMISS_KEY) === '1') return;
    renderBanner({
      strong: 'Enrolled in this microcredential?',
      message: 'Sign in with your enrollment email to receive your pre-survey (the consent &amp; start form) — it unlocks the sessions.',
      ctaLabel: null,
      ctaHref: null,
      onDismiss: () => set(HINT_DISMISS_KEY, '1'),
    });
  }

  function run() {
    if (sessionDismissed) return;
    const lid = get('hb:learner_id');
    if (!lid) { showAnonymousHint(); return; }

    ensureToken(lid).then((token) => {
      if (!token) return; // can't authenticate from here; static flow still works
      return api('/api/completion-check?learner_id=' + encodeURIComponent(lid), lid, token)
        .then((data) => {
          if (!data || !data.ok || !data.gate) return;
          const consent = data.gate.consent;
          if (!consent || !consent.active || consent.completed) return;
          return api('/api/survey-link?type=consent&learner_id=' + encodeURIComponent(lid), lid, token)
            .then((d) => {
              if (!d || !d.active || !d.link) return;
              renderBanner({
                strong: 'Before you begin:',
                message: 'complete the short pre-survey (consent &amp; start form) to unlock the sessions.',
                ctaLabel: 'Open the pre-survey →',
                ctaHref: d.link,
                onDismiss: () => { try { sessionStorage.setItem('tp:presurvey-bar-dismissed', '1'); } catch (_) {} },
              });
            });
        });
    }).catch(() => {});
  }

  // re-run right after a sign-in completes in this tab
  window.addEventListener('tp:learner-session', () => { removeBanner(); setTimeout(run, 300); });

  // let the React shell mount + its own startup fetches settle first
  function defer() { setTimeout(run, 1400); }
  if (document.readyState === 'complete') defer();
  else window.addEventListener('load', defer);
})();
