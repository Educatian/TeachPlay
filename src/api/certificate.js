/**
 * GET /certificate?code=<claim-code> — printable certificate view.
 *
 * A human-readable "paper" layer over a signed VC. The cryptographic
 * truth still lives in the signed JSON that /api/claim returns; this
 * page is the socially usable artifact a recruiter, LinkedIn viewer,
 * or parent will actually look at. The QR on the page anchors back to
 * the verifiable path so the paper is not a bare claim.
 *
 * Reads CLAIM_CODES[code] **non-destructively** so the learner can
 * print first and still redeem the code into a wallet after. Once
 * /api/claim consumes the code, this page 404s — at that point the
 * learner holds the signed VC and can re-render the certificate
 * against that (future enhancement: accept ?vc=<upload>).
 *
 * Output is pure HTML + inline SVG, no client-side JS, optimized for
 * "Print → Save as PDF" in a browser. Page size defaults to US Letter
 * via @page; A4 is a single swap in the CSS if needed.
 */
import qrcode from 'qrcode-generator';

const CODE_PATTERN = /^cl_[0-9a-f]{64}$/;

const ACHIEVEMENT_NAME = 'AI-enhanced Educational Game Design';
const CERTIFICATE_TITLE = 'Microcredential';
const ISSUER_NAME = 'The University of Alabama — College of Education';
const ISSUER_DID = 'did:web:teachplay.dev';

function qrSvg(text) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ scalable: true, margin: 1 });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatIssueDate(iso) {
  // "May 2, 2026" — the only part of the VC's validFrom that belongs
  // on a wall. Fall back to the ISO date if parsing fails so the
  // certificate never renders blank.
  try {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return iso || ''; }
}

function formatCohort(slug) {
  // "2026-spring" → "Cohort 2026 · Spring"
  const m = String(slug || '').match(/^(\d{4})-([a-z]+)$/);
  if (!m) return `Cohort ${slug}`;
  const season = m[2].charAt(0).toUpperCase() + m[2].slice(1);
  return `Cohort ${m[1]} · ${season}`;
}

function renderPage({ payload, qrSvgMarkup, verifyUrl, code }) {
  const learnerName = payload.name || 'Credential Recipient';
  const cohort = formatCohort(payload.cohort);
  const issueDate = formatIssueDate(payload.validFrom || payload.mintedAt);
  const learnerId = payload.id;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(ACHIEVEMENT_NAME)} — ${escapeHtml(learnerName)}</title>
  <style>
    :root {
      --ink: #1a1a1a;
      --accent: #990000;        /* UA crimson */
      --paper: #fdfcf7;
      --rule: #c9b37d;          /* warm brass */
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #e5e5e5; color: var(--ink); font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif; }

    .page {
      width: 8.5in;
      min-height: 11in;
      margin: 24px auto;
      background: var(--paper);
      padding: 0.9in 1in;
      box-shadow: 0 2px 12px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .border {
      position: absolute;
      inset: 0.45in;
      border: 1px solid var(--rule);
      pointer-events: none;
    }
    .border::before {
      content: "";
      position: absolute;
      inset: 6px;
      border: 1px solid var(--rule);
      opacity: 0.55;
    }

    header { text-align: center; margin-top: 0.4in; }
    header .kicker { font: 600 11pt/1.2 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.28em; color: var(--accent); text-transform: uppercase; }
    header h1 { font-size: 22pt; margin: 0.35in 0 0.1in; font-weight: 700; letter-spacing: 0.01em; }
    header .issuer { font-size: 13pt; margin: 0; color: #444; font-style: italic; }

    main { margin-top: 0.55in; text-align: center; }
    .awarded { font-size: 12pt; color: #555; letter-spacing: 0.04em; }
    .recipient { font-family: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif; font-size: 34pt; margin: 0.22in 0 0.22in; border-bottom: 1px solid var(--rule); padding-bottom: 0.14in; font-weight: 500; }
    .achievement-line { font-size: 12pt; color: #555; margin-bottom: 0.12in; }
    .achievement { font-size: 18pt; font-style: italic; margin: 0 0 0.35in; }
    .context { font-size: 12pt; color: #444; line-height: 1.55; }
    .context strong { color: var(--ink); }

    .seal-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; padding-top: 0.55in; }
    .signature { text-align: center; min-width: 2.2in; }
    .signature .rule { border-top: 1px solid var(--ink); margin-bottom: 4px; }
    .signature .role { font: 10pt/1.2 'Helvetica Neue', Arial, sans-serif; color: #555; letter-spacing: 0.05em; text-transform: uppercase; }

    .qr-block { text-align: center; min-width: 1.6in; }
    .qr-block svg { width: 1.3in; height: 1.3in; display: block; margin: 0 auto 4px; }
    .qr-block .qr-caption { font: 9pt/1.25 'Helvetica Neue', Arial, sans-serif; color: #555; max-width: 1.6in; }

    footer { margin-top: 0.45in; font: 8.5pt/1.35 'SF Mono', Menlo, Consolas, monospace; color: #666; text-align: center; word-break: break-all; }
    footer .label { color: #999; }

    .screen-only { display: block; background: #fff4cc; border: 1px solid #e4c664; padding: 10px 14px; margin: 0 auto 12px; max-width: 8.5in; font: 12px/1.35 'Helvetica Neue', Arial, sans-serif; color: #5c4800; }
    .screen-only a { color: #5c4800; }
    .screen-only button { margin-left: 8px; padding: 4px 10px; font: inherit; border: 1px solid #b8922d; background: #fff; border-radius: 4px; cursor: pointer; }

    @media print {
      html, body { background: #fff; }
      .page { margin: 0; box-shadow: none; width: auto; min-height: auto; }
      .screen-only { display: none !important; }
      @page { size: Letter; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="screen-only">
    This is the printable certificate view. Use <strong>File → Print</strong> (or Ctrl/Cmd+P) and "Save as PDF". The claim code is not consumed by printing; you can still redeem it into a wallet afterward at <a href="/claim?code=${escapeHtml(code)}">the claim page</a>.
    <button onclick="window.print()">Print now</button>
  </div>
  <article class="page" role="document">
    <div class="border" aria-hidden="true"></div>

    <header>
      <div class="kicker">${escapeHtml(CERTIFICATE_TITLE)}</div>
      <h1>${escapeHtml(ACHIEVEMENT_NAME)}</h1>
      <p class="issuer">Issued by ${escapeHtml(ISSUER_NAME)}</p>
    </header>

    <main>
      <div class="awarded">is hereby awarded to</div>
      <div class="recipient">${escapeHtml(learnerName)}</div>
      <div class="achievement-line">for meeting the proficiency criteria of</div>
      <div class="achievement">${escapeHtml(ACHIEVEMENT_NAME)}</div>
      <div class="context">
        ${escapeHtml(cohort)} · <strong>Issued ${escapeHtml(issueDate)}</strong>
      </div>
    </main>

    <div class="seal-row">
      <div class="signature">
        <div class="rule"></div>
        <div class="role">Registrar, College of Education</div>
      </div>
      <div class="qr-block">
        ${qrSvgMarkup}
        <div class="qr-caption">Scan to verify<br />or visit<br />${escapeHtml(new URL(verifyUrl).host)}</div>
      </div>
    </div>

    <footer>
      <div><span class="label">Issuer DID:</span> ${escapeHtml(ISSUER_DID)}</div>
      <div><span class="label">Subject ID:</span> urn:uuid:${escapeHtml(learnerId)}</div>
    </footer>
  </article>
</body>
</html>
`;
}

// Friendly on-brand page for the states a learner reaches when they open
// /certificate WITHOUT a usable claim code: they typed the URL, followed a
// stale link, or the code was already redeemed/expired. A bare text/plain
// 400/404 reads like a crash; this explains what happened and what to do
// next, in the certificate's own crimson/serif styling. Status codes are
// kept (400/404) for correctness; only the body becomes human-friendly.
function renderNotice({ status, heading, message, actions }) {
  const actionHtml = (actions || [])
    .map((a) => `<a class="btn${a.primary ? ' primary' : ''}" href="${escapeHtml(a.href)}">${escapeHtml(a.label)}</a>`)
    .join('');
  const body = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(heading)} — ${escapeHtml(ACHIEVEMENT_NAME)}</title>
  <style>
    :root { --ink:#1a1a1a; --accent:#990000; --paper:#fdfcf7; --rule:#c9b37d; }
    * { box-sizing: border-box; }
    html, body { margin:0; min-height:100%; background:#e5e5e5; color:var(--ink);
      font-family:'Iowan Old Style','Palatino Linotype',Palatino,Georgia,'Times New Roman',serif; }
    body { display:grid; place-items:center; min-height:100vh; padding:24px; }
    .card { width:min(560px,100%); background:var(--paper); border:1px solid var(--rule);
      box-shadow:0 2px 12px rgba(0,0,0,0.15); padding:40px 36px; text-align:center; position:relative; }
    .card::before { content:""; position:absolute; inset:8px; border:1px solid var(--rule); opacity:.5; pointer-events:none; }
    .kicker { font:600 11pt/1.2 'Helvetica Neue',Arial,sans-serif; letter-spacing:.28em;
      color:var(--accent); text-transform:uppercase; margin-bottom:18px; }
    h1 { font-size:21pt; margin:0 0 14px; font-weight:700; }
    p { font-size:12.5pt; line-height:1.6; color:#444; margin:0 auto 14px; max-width:42ch; }
    .actions { margin-top:24px; display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }
    .btn { display:inline-flex; align-items:center; min-height:42px; padding:0 18px; border-radius:6px;
      border:1px solid var(--accent); color:var(--accent); background:transparent; text-decoration:none;
      font:600 11pt/1 'Helvetica Neue',Arial,sans-serif; }
    .btn.primary { background:var(--accent); color:#fff; }
    .btn:focus-visible { outline:3px solid #c9b37d; outline-offset:2px; }
  </style>
</head>
<body>
  <main class="card" role="main">
    <div class="kicker">${escapeHtml(CERTIFICATE_TITLE)}</div>
    <h1>${escapeHtml(heading)}</h1>
    <p>${message}</p>
    <div class="actions">${actionHtml}</div>
  </main>
</body>
</html>`;
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export async function handleCertificate(request, env, ctx) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code || !CODE_PATTERN.test(code)) {
    return renderNotice({
      status: 400,
      heading: 'No certificate to show yet',
      message: 'This page prints your certificate once your instructor issues it. ' +
        'Finish all 12 sessions, request your credential, and you will receive a personal ' +
        'certificate link by email. Open that link here to print or save your certificate.',
      actions: [
        { label: 'Go to the course', href: '/app/', primary: true },
        { label: 'How issuance works', href: '/credential.html' },
      ],
    });
  }

  const raw = await env.CLAIM_CODES.get(code);
  if (!raw) {
    return renderNotice({
      status: 404,
      heading: 'This certificate link is no longer active',
      message: 'The link has expired or has already been redeemed into a wallet. ' +
        'If you already claimed your credential, you still hold the signed version — ' +
        'no further action is needed. If you need to print it again, ask your instructor ' +
        'to re-issue your certificate link.',
      actions: [
        { label: 'Back to the course', href: '/app/', primary: true },
        { label: 'About this credential', href: '/credential.html' },
      ],
    });
  }

  let payload;
  try { payload = JSON.parse(raw); }
  catch { return new Response('Claim payload corrupt', { status: 500 }); }

  const verifyUrl = `${url.origin}/claim?code=${code}`;
  const qrSvgMarkup = qrSvg(verifyUrl);

  return new Response(renderPage({ payload, qrSvgMarkup, verifyUrl, code }), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
