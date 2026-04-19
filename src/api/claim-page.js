/**
 * GET /claim?code=<code> — learner-facing wallet handoff page.
 *
 * Rendered inline (no separate HTML asset) so the claim code can be
 * baked into the three handoff URLs at request time without client-JS
 * resolution. The page is minimal on purpose: the three cards on
 * credential.html#wallet still live in the static site and explain
 * the paths; this page is the short "you have a code, pick where it
 * goes" step that immediately precedes a wallet interaction.
 *
 * Three paths, each carrying the code:
 *   P1 · DCC LCW  → dccrequest://… with vc_request_url=/api/claim?code=…
 *   P2 · Download → direct fetch of /api/claim?code=… with a filename
 *   P3 · OID4VCI  → openid-credential-offer://… pre-authorized_code=<code>
 *
 * The code is NOT redeemed by rendering this page — only by the
 * subsequent fetch to /api/claim. Load the page as many times as you
 * want until the code expires or is used.
 */

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s) { return escapeHtml(s); }

const CODE_PATTERN = /^cl_[0-9a-f]{64}$/;

function renderPage({ code, claimUrl, lcwUrl, oid4vciUrl }) {
  const codeAttr = escapeAttr(code);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Claim your credential · teachplay</title>
  <style>
    :root { color-scheme: light dark; }
    body { font: 15px/1.5 system-ui, -apple-system, Segoe UI, sans-serif; max-width: 640px; margin: 2.5rem auto; padding: 0 1.25rem; }
    h1 { font-size: 1.4rem; margin: 0 0 0.4rem; }
    p.lede { color: #555; margin: 0 0 1.6rem; }
    section { border: 1px solid #ddd; border-radius: 8px; padding: 1rem 1.1rem; margin-bottom: 0.9rem; }
    section h2 { font-size: 1rem; margin: 0 0 0.3rem; }
    section p { margin: 0 0 0.7rem; color: #555; }
    a.btn, button.btn {
      display: inline-block; padding: 0.55rem 0.95rem; border-radius: 6px;
      background: #111; color: #fff; text-decoration: none; border: 0;
      font-size: 0.95rem; cursor: pointer;
    }
    a.btn.secondary, button.btn.secondary { background: transparent; color: #111; border: 1px solid #111; }
    code.codebox { display: block; padding: 0.45rem 0.6rem; background: #f4f4f4; border-radius: 4px; font-size: 0.8rem; word-break: break-all; color: #333; }
    footer { color: #888; font-size: 0.85rem; margin-top: 1.6rem; }
    @media (prefers-color-scheme: dark) {
      body { background: #111; color: #eee; }
      p.lede, section p { color: #bbb; }
      section { border-color: #333; }
      code.codebox { background: #1c1c1c; color: #ddd; }
      a.btn { background: #eee; color: #111; }
      a.btn.secondary { color: #eee; border-color: #eee; }
    }
  </style>
</head>
<body>
  <h1>Claim your credential</h1>
  <p class="lede">Pick how you want to receive the signed Verifiable Credential. Any wallet that understands OpenBadge v3 / W3C VC 2.0 will take it.</p>

  <section>
    <h2>1 · DCC Learner Credential Wallet</h2>
    <p>If you have the Digital Credentials Consortium Learner Credential Wallet installed, tap this to import directly.</p>
    <a class="btn" href="${escapeAttr(lcwUrl)}">Open in LCW</a>
  </section>

  <section>
    <h2>2 · Download the JSON</h2>
    <p>Save the signed credential to disk, then import it manually into any wallet that supports "add from file" (Lissi, Trinsic, Microsoft Entra, generic OID4VC wallets).</p>
    <a class="btn" href="${escapeAttr(claimUrl)}" download>Download</a>
  </section>

  <section>
    <h2>3 · OID4VCI offer</h2>
    <p>For wallets that support OpenID for Verifiable Credential Issuance. Scan or tap to exchange the pre-authorized code for a credential.</p>
    <a class="btn secondary" href="${escapeAttr(oid4vciUrl)}">Open in OID4VCI wallet</a>
    <p style="margin-top:0.8rem">Raw offer URL:</p>
    <code class="codebox">${escapeHtml(oid4vciUrl)}</code>
  </section>

  <footer>
    <p>Claim code <code>${codeAttr}</code> — single-use. Once redeemed it cannot be reused; load this page as many times as you need until then.</p>
  </footer>
</body>
</html>
`;
}

function buildLcwUrl(origin, code) {
  const params = new URLSearchParams({
    auth_type: 'code',
    issuer: `${origin}/credential/issuer-v3.json`,
    vc_request_url: `${origin}/api/claim?code=${code}`,
    challenge: code, // challenge doubles as the redemption nonce; safe because it's single-use
  });
  return `dccrequest://request?${params.toString()}`;
}

function buildOid4vciOfferUrl(origin, code) {
  // Wallet unwraps `credential_offer`, reads credential_issuer, and
  // POSTs pre-authorized_code to ${credential_issuer}/oid4vci/token.
  // The token endpoint is not live yet — this URL is for wallet
  // registration / client-side smoketests while P3 is being built.
  const offer = {
    credential_issuer: origin,
    credential_configuration_ids: ['OpenBadgeCredential'],
    grants: {
      'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
        'pre-authorized_code': code,
      },
    },
  };
  const encoded = encodeURIComponent(JSON.stringify(offer));
  return `openid-credential-offer://?credential_offer=${encoded}`;
}

export async function handleClaimPage(request, env, ctx) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code || !CODE_PATTERN.test(code)) {
    return new Response('Missing or malformed claim code. You were given a URL like /claim?code=cl_... — check that the full code is in the address bar.', {
      status: 400,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  const origin = url.origin;
  const claimUrl = `${origin}/api/claim?code=${code}`;
  const lcwUrl = buildLcwUrl(origin, code);
  const oid4vciUrl = buildOid4vciOfferUrl(origin, code);

  return new Response(renderPage({ code, claimUrl, lcwUrl, oid4vciUrl }), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
