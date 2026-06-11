// teachplay-session-capture.js — persist the learner session token in the SPA.
//
// The React shell's sign-in calls POST /api/enroll and stores only
// `hb:learner_id`, discarding the `session_token` the Worker returns. Every
// learner-token-gated endpoint (/api/progress, /api/completion-check,
// /api/survey-link) then rejects the SPA with 403, so the survey-gate UI can
// never render. The bundle is a built artifact, so instead of patching it we
// wrap window.fetch (the bundle resolves `fetch` at call time) and capture the
// enroll response: learner_id + session_token + name/email land in the same
// localStorage keys the static pages' enroll.js uses, making the two flows
// interchangeable. /api/enroll is idempotent per email and always returns the
// row's session_token, so signing in again from a fresh browser restores the
// token too.
(() => {
  'use strict';
  if (window.__tpSessionCapture) return;
  window.__tpSessionCapture = true;

  const save = (key, value) => {
    if (!value) return;
    try { localStorage.setItem(key, String(value)); } catch (_) {}
  };

  const captureEnroll = (requestBody, data) => {
    if (!data || !data.ok || !data.learner_id) return;
    save('hb:learner_id', data.learner_id);
    save('hb:learner_token', data.session_token);
    save('hb:learner_name', data.name);
    try {
      const body = typeof requestBody === 'string' ? JSON.parse(requestBody) : null;
      if (body && body.email) save('hb:learner_email', String(body.email).toLowerCase());
    } catch (_) {}
    try { window.dispatchEvent(new CustomEvent('tp:learner-session')); } catch (_) {}
  };

  const origFetch = window.fetch;
  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : ((input && input.url) || '');
    const promise = origFetch.apply(this, arguments);
    if (/\/api\/enroll(?:\?|$)/.test(url)) {
      promise.then((res) => {
        if (!res || !res.ok) return;
        res.clone().json()
          .then((data) => captureEnroll(init && init.body, data))
          .catch(() => {});
      }).catch(() => {});
    }
    return promise;
  };
})();
