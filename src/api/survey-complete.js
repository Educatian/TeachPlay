/**
 * Survey-return verification — the public endpoints the learner's browser lands
 * on after the Qualtrics end-of-survey redirect:
 *
 *   GET /api/consent-complete?learner_id=&sig=&rid=   (PRE consent)
 *   GET /api/survey-complete?learner_id=&sig=&rid=    (POST completion)
 *
 * Flow:
 *   1. Verify the HMAC `sig` matches `${type}:${learner_id}` (WORKER_SECRET /
 *      ISSUER_API_KEY). A forged learner_id fails here.
 *   2. Server-to-server confirm the Qualtrics response `rid` exists, is Finished,
 *      and its embedded learner_id matches. The Qualtrics token never leaves the
 *      Worker.
 *   3. On success: record consent/survey completion in D1 and redirect the learner
 *      to a friendly TeachPlay page (course for consent; certificate/claim page
 *      for post).
 *   4. On a brief Qualtrics not-found (response latency), show a "give it a few
 *      seconds and refresh" page rather than a hard failure.
 *
 * GATE POLICY = submission, not consent-yes: reaching this endpoint means the form
 * was submitted, which is all the gate requires. The opt-in research answers are
 * never read here.
 *
 * Feature-detect: if QUALTRICS_* secrets are unset the verification can't run, so
 * we show a friendly "survey gate not yet enabled" notice and (for safety) still
 * redirect onward — the gate is INACTIVE until configured, never a lockout.
 */
import {
  verifySurveyToken,
  qualtricsVerifyResponse,
  recordConsent,
  recordSurvey,
  surveyGateColumnsPresent,
} from '../lib/survey-gate.js';

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function notice({ status, heading, message, actions, refresh }) {
  const actionHtml = (actions || [])
    .map((a) => `<a class="btn${a.primary ? ' primary' : ''}" href="${escapeHtml(a.href)}">${escapeHtml(a.label)}</a>`)
    .join('');
  const meta = refresh ? `<meta http-equiv="refresh" content="${refresh.secs};url=${escapeHtml(refresh.url)}" />` : '';
  const body = `<!doctype html><html lang="en"><head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
${meta}
<title>${escapeHtml(heading)} — TeachPlay</title>
<style>
  :root { --ink:#1a1a1a; --accent:#990000; --paper:#fdfcf7; --rule:#c9b37d; }
  *{box-sizing:border-box} html,body{margin:0;min-height:100%;background:#e5e5e5;color:var(--ink);
    font-family:'Iowan Old Style','Palatino Linotype',Palatino,Georgia,'Times New Roman',serif}
  body{display:grid;place-items:center;min-height:100vh;padding:24px}
  .card{width:min(560px,100%);background:var(--paper);border:1px solid var(--rule);
    box-shadow:0 2px 12px rgba(0,0,0,.15);padding:40px 36px;text-align:center;position:relative}
  .card::before{content:"";position:absolute;inset:8px;border:1px solid var(--rule);opacity:.5;pointer-events:none}
  .kicker{font:600 11pt/1.2 'Helvetica Neue',Arial,sans-serif;letter-spacing:.28em;color:var(--accent);
    text-transform:uppercase;margin-bottom:18px}
  h1{font-size:21pt;margin:0 0 14px;font-weight:700}
  p{font-size:12.5pt;line-height:1.6;color:#444;margin:0 auto 14px;max-width:42ch}
  .actions{margin-top:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
  .btn{display:inline-flex;align-items:center;min-height:42px;padding:0 18px;border-radius:6px;
    border:1px solid var(--accent);color:var(--accent);background:transparent;text-decoration:none;
    font:600 11pt/1 'Helvetica Neue',Arial,sans-serif}
  .btn.primary{background:var(--accent);color:#fff}
  .btn:focus-visible{outline:3px solid #c9b37d;outline-offset:2px}
</style></head>
<body><main class="card" role="main">
  <div class="kicker">TeachPlay Microcredential</div>
  <h1>${escapeHtml(heading)}</h1>
  <p>${message}</p>
  <div class="actions">${actionHtml}</div>
</main></body></html>`;
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function redirect(to) {
  return new Response(null, { status: 302, headers: { location: to, 'cache-control': 'no-store' } });
}

/**
 * @param type 'consent' | 'post'
 */
export async function handleSurveyReturn(request, env, type) {
  const url = new URL(request.url);
  const learner_id = url.searchParams.get('learner_id') || '';
  const sig = url.searchParams.get('sig') || '';
  const rid = url.searchParams.get('rid') || '';

  const onwardConsent = '/app/?consent=ok';
  const onwardPost = '/progress.html?survey=ok';
  const onward = type === 'consent' ? onwardConsent : onwardPost;

  // 1. HMAC sig — a forged learner_id fails here.
  const sigOk = await verifySurveyToken(env, type, learner_id, sig);
  if (!sigOk) {
    return notice({
      status: 400,
      heading: "We couldn't confirm that link",
      message: 'The verification signature on this link is missing or invalid. ' +
        'Please re-open the survey from your TeachPlay course page so the link is correctly signed.',
      actions: [{ label: 'Back to the course', href: '/app/', primary: true }],
    });
  }

  const sid = type === 'consent' ? env.QUALTRICS_CONSENT_SID : env.QUALTRICS_POST_SID;

  // Feature-detect OFF: secrets/columns absent → gate inactive, never a lockout.
  if (!env.QUALTRICS_TOKEN || !sid || !(await surveyGateColumnsPresent(env))) {
    return notice({
      status: 200,
      heading: 'Thanks — survey received',
      message: 'The survey gate is not yet switched on for this cohort, so your access is ' +
        'unaffected. You can continue using TeachPlay as normal.',
      actions: [
        { label: type === 'consent' ? 'Start the program' : 'See your progress', href: onward, primary: true },
      ],
    });
  }

  // 2. Confirm the Qualtrics response is real + Finished + matching learner.
  const v = await qualtricsVerifyResponse(env, { sid, rid, expectedLearnerId: learner_id });

  if (!v.ok && v.status === 'not_found') {
    // Qualtrics latency — auto-refresh in a few seconds.
    const retryUrl = url.pathname + url.search;
    return notice({
      status: 202,
      heading: 'Almost there…',
      message: 'Your survey was submitted and we are confirming it with Qualtrics. ' +
        'This usually takes a few seconds — this page will refresh automatically.',
      actions: [{ label: 'Refresh now', href: retryUrl, primary: true }],
      refresh: { secs: 5, url: retryUrl },
    });
  }

  if (!v.ok && v.status === 'not_finished') {
    return notice({
      status: 409,
      heading: 'Survey not complete yet',
      message: 'It looks like the survey was started but not submitted. ' +
        'Please return to the survey and submit it to ' +
        (type === 'consent' ? 'start the program.' : 'unlock your certificate.'),
      actions: [{ label: 'Back to the course', href: '/app/', primary: true }],
    });
  }

  if (!v.ok && v.status === 'learner_mismatch') {
    return notice({
      status: 400,
      heading: "We couldn't match that survey",
      message: 'The submitted survey is linked to a different learner. ' +
        'Please re-open the survey from your own TeachPlay course page.',
      actions: [{ label: 'Back to the course', href: '/app/', primary: true }],
    });
  }

  if (!v.ok) {
    return notice({
      status: 502,
      heading: "We couldn't confirm your survey",
      message: 'We had trouble confirming your submission with Qualtrics. ' +
        'Please try again in a moment, or contact your instructor if it persists.',
      actions: [{ label: 'Try again', href: url.pathname + url.search, primary: true }],
    });
  }

  // 3. Success — record completion and redirect onward.
  if (type === 'consent') {
    await recordConsent(env, learner_id, rid);
    return redirect(onwardConsent);
  }
  await recordSurvey(env, learner_id, rid);
  return redirect(onwardPost);
}

export function handleConsentComplete(request, env) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  return handleSurveyReturn(request, env, 'consent');
}

export function handleSurveyComplete(request, env) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  return handleSurveyReturn(request, env, 'post');
}
