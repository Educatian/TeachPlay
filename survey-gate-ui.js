/**
 * survey-gate-ui.js — learner-facing CTAs for the two survey touchpoints.
 *
 * GATE POLICY = submission. The PRE consent form gates program START; the POST
 * completion survey gates the certificate CLAIM. This script:
 *   1. Asks /api/completion-check for the feature-detected gate status.
 *   2. If the consent gate is ACTIVE and not yet completed, on session/start
 *      pages it shows a banner "Complete the consent form to begin" linking to
 *      the signed consent link from /api/survey-link?type=consent.
 *   3. If the post gate is ACTIVE and not yet completed, on progress/claim flow
 *      it shows "Complete the post-program survey to unlock your certificate"
 *      linking to /api/survey-link?type=post.
 *   4. Once recorded (gate.completed===true), shows a quiet done state.
 *
 * Feature-detect: when the gate is INACTIVE (secrets/columns absent) this script
 * renders nothing — the legacy flow is unchanged and the live class is not
 * locked out.
 */
(function () {
  'use strict';
  var LID = (function () { try { return localStorage.getItem('hb:learner_id') || ''; } catch (_) { return ''; } })();
  var TOK = (function () { try { return localStorage.getItem('hb:learner_token') || ''; } catch (_) { return ''; } })();
  if (!LID) return; // not enrolled yet — enroll.js handles registration first

  var isSessionPage = /session-\d+\.html|\/start\.html/i.test(location.pathname) ||
                      /\/start(\.html)?$/i.test(location.pathname);
  var isClaimFlow = /progress\.html|claim\.html|credential\.html/i.test(location.pathname);

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html != null) n.innerHTML = html;
    return n;
  }

  function banner(kind, message, ctaLabel, ctaHref, done) {
    var id = 'tp-survey-gate-' + kind;
    if (document.getElementById(id)) return;
    var bg = done ? '#eef7ee' : '#fff7e6';
    var border = done ? '#1a7f37' : '#be1a2f';
    var b = el('div', {
      id: id, role: 'status',
      style: 'max-width:880px;margin:16px auto;padding:14px 18px;border-left:4px solid ' + border +
             ';background:' + bg + ';border-radius:6px;font:15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;color:#1a1a1a;',
    });
    var msg = el('span', null, message);
    b.appendChild(msg);
    if (ctaLabel && ctaHref) {
      var a = el('a', {
        href: ctaHref,
        style: 'display:inline-block;margin-left:12px;background:#be1a2f;color:#fff;text-decoration:none;' +
               'padding:8px 16px;border-radius:6px;font-weight:600;font-size:14px;',
      }, ctaLabel);
      b.appendChild(a);
    }
    var main = document.getElementById('main') || document.querySelector('main') || document.body;
    if (main.firstChild) main.insertBefore(b, main.firstChild); else main.appendChild(b);
  }

  function getSignedLink(type) {
    return fetch('/api/survey-link?type=' + type + '&learner_id=' + encodeURIComponent(LID), {
      headers: { 'X-Learner-Token': TOK, 'X-Learner-ID': LID },
    }).then(function (r) { return r.json(); }).then(function (d) {
      return (d && d.active && d.link) ? d.link : null;
    }).catch(function () { return null; });
  }

  function run() {
  fetch('/api/completion-check?learner_id=' + encodeURIComponent(LID), {
    headers: { 'X-Learner-Token': TOK },
  }).then(function (r) { return r.json(); }).then(function (data) {
    if (!data || !data.ok || !data.gate) return;
    var g = data.gate;

    // PRE consent — gates START.
    if (isSessionPage && g.consent && g.consent.active) {
      if (g.consent.completed) {
        // quiet: no banner needed once consent is recorded
      } else {
        getSignedLink('consent').then(function (link) {
          if (!link) return;
          banner('consent',
            '<strong>Before you begin:</strong> complete the short consent &amp; start form to unlock the sessions.',
            'Complete the consent form to begin →', link, false);
        });
      }
    }

    // POST completion survey — gates CLAIM.
    if (isClaimFlow && g.survey && g.survey.active) {
      if (g.survey.completed) {
        banner('post-done', '<strong>✓ Post-program survey received.</strong> Your certificate is unlocked.',
          null, null, true);
      } else if (data.complete) {
        getSignedLink('post').then(function (link) {
          if (!link) return;
          banner('post',
            '<strong>One more step:</strong> complete the post-program survey to unlock your certificate.',
            'Complete the post-program survey →', link, false);
        });
      }
    }
  }).catch(function () {});
  }

  // Defer until after load + a short delay so the page's own xapi-flush →
  // completion-check sequence (e.g. session-12 claim readiness) runs first; this
  // banner is non-critical UI and must not race the page's primary flow.
  function defer() { setTimeout(run, 1200); }
  if (document.readyState === 'complete') defer();
  else window.addEventListener('load', defer);
})();
