/**
 * GET /api/email-verify?t=<token> — redeem a one-time email claim token.
 *
 * Looks up the token in CLAIMS_KV, issues + signs the credential,
 * marks the token as used (so the link is truly one-time), and
 * returns the signed VC JSON to the browser.
 *
 * Response (200):
 *   { "ok": true, "signed": <VC>, "name": "Ada L.", "id": "<uuid>" }
 */
import { issueCredential } from '../lib/issue.js';
import { sendEmail } from '../lib/email.js';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function toBase64(str) {
  // Workers-safe UTF-8 → base64: encode to bytes, map to Latin-1 string, btoa.
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function sendClaimReceiptEmail(env, { to, name, credentialId, signed }) {
  const vcJson = JSON.stringify(signed, null, 2);
  const attachment = toBase64(vcJson);

  const html = `
  <h1 style="font-size:22px;margin:0 0 16px;line-height:1.3;">Credential claimed.</h1>
  <p style="font-size:16px;line-height:1.6;margin:0 0 16px;color:#333;">
    Hi ${name}, your <strong>AI-enhanced Educational Game Design</strong>
    credential has been issued and signed. A copy is attached to this email
    as <code>teachplay-credential.json</code> — keep it somewhere safe.
  </p>
  <p style="font-size:15px;line-height:1.6;margin:0 0 16px;color:#555;">
    Credential ID: <code>${credentialId}</code>
  </p>
  <p style="font-size:15px;line-height:1.6;margin:0 0 0;color:#555;">
    When you need to show it — for a job, a transfer, or a transcript —
    employers and institutions can verify its authenticity at
    <a href="https://teachplay.dev/verifier.html" style="color:#be1a2f;">
      teachplay.dev/verifier.html
    </a>.
  </p>`;

  try {
    // Resend supports inline base64 attachments via `attachments: [{ content, filename }]`.
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'TeachPlay Credentials <credentials@teachplay.dev>',
        to: [to],
        subject: 'Your signed credential (copy for your records)',
        html,
        attachments: [{ filename: 'teachplay-credential.json', content: attachment }],
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  } catch { /* fire-and-forget — user already got the VC in-browser */ }
}

export async function handleEmailVerify(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get('t');

  if (!token)        return json({ error: 'Missing token' }, 400);
  if (!env.CLAIMS_KV) return json({ error: 'KV store not configured' }, 500);

  const raw = await env.CLAIMS_KV.get(`claim:${token}`);
  if (!raw) return json({ error: 'Token not found or expired' }, 404);

  let claim;
  try { claim = JSON.parse(raw); }
  catch { return json({ error: 'Malformed claim record' }, 500); }

  if (claim.used) return json({ error: 'This link has already been used.' }, 409);

  const id = crypto.randomUUID();
  const payload = {
    id,
    name: claim.name,
    email: claim.email,
    cohort: claim.cohort || '2026-spring',
    validFrom: new Date().toISOString(),
    noStatus: false,
  };

  let signed;
  try {
    ({ signed } = await issueCredential(payload, env, request.url));
  } catch (e) {
    return json({ error: 'Signing failed', detail: e.message }, 500);
  }

  claim.used = true;
  claim.issuedId = id;
  claim.issuedAt = new Date().toISOString();
  await env.CLAIMS_KV.put(`claim:${token}`, JSON.stringify(claim));

  sendClaimReceiptEmail(env, { to: claim.email, name: claim.name, credentialId: id, signed });

  return json({ ok: true, signed, name: claim.name, id });
}
