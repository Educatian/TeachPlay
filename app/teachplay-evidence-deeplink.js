// teachplay-evidence-deeplink.js — open the SPA's evidence submission editor
// from a plain URL.
//
// The React shell has no URL routing (views are internal state), so static
// pages (session-12, progress, the post-completion survey) had no way to send
// a learner to the final submission editor — a field-reported dead end in the
// post-survey → evidence → certificate handoff. This script makes
// /?goto=evidence and /app/?goto=evidence (also #evidence) work by driving the
// rendered UI: open My Dashboard if needed, then click the "Submit Evidence" /
// "Open final submission" button once React has painted it.
(() => {
  'use strict';
  if (window.__tpEvidenceDeeplink) return;
  window.__tpEvidenceDeeplink = true;

  const params = new URLSearchParams(location.search);
  const wanted = params.get('goto') === 'evidence' || location.hash === '#evidence';
  if (!wanted) return;

  const normalize = (text) => (text || '').replace(/\s+/g, ' ').trim();
  const buttonLike = (text) =>
    [...document.querySelectorAll('button, a')].find((el) => normalize(el.textContent) === text);
  const buttonContaining = (text) =>
    [...document.querySelectorAll('button, a')].find((el) => normalize(el.textContent).includes(text));

  // Strict: the editor's page header reads exactly "Evidence Submission"
  // (an h2 in the bundle; the heading-refine overlay may promote it to h1).
  // Other views — e.g. the course view's final-submission promo panel —
  // mention the phrase in passing, so a body-text substring match stops
  // too early.
  const inEditor = () =>
    [...document.querySelectorAll('h1, h2')].some((h) => normalize(h.textContent) === 'Evidence Submission');

  // Every step retries: a click that lands before React attaches handlers
  // (or that a late mount re-renders away) is simply repeated on the next
  // tick until the editor header is actually on screen.
  const started = Date.now();
  let lastDashClick = 0;
  let ticking = false;

  const tick = () => {
    if (inEditor()) {
      ticking = false;
      // Done — drop the param so a reload doesn't re-trigger the navigation.
      try { history.replaceState(null, '', location.pathname); } catch (_) {}
      return;
    }
    if (Date.now() - started > 30000) { ticking = false; return; }
    const direct = document.querySelector('button[data-tour="submit"]')
      || buttonContaining('Submit Evidence')
      || buttonLike('Open final submission');
    if (direct) {
      direct.click();
    } else if (Date.now() - lastDashClick > 1500) {
      const dash = buttonLike('My Dashboard') || buttonContaining('My Dashboard');
      if (dash) { lastDashClick = Date.now(); dash.click(); }
    }
    setTimeout(tick, 500);
  };

  const start = () => { if (!ticking) { ticking = true; setTimeout(tick, 1200); } };
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
  // Re-arm right after a sign-in completes (the dashboard re-renders then).
  window.addEventListener('tp:learner-session', start);
})();
