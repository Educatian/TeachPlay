/**
 * POST /api/email-request — learner-initiated credential issuance via email link.
 *
 * No API key required from the browser. A one-time UUID token stored in
 * CLAIMS_KV gates the actual signing step (/api/email-verify).
 *
 * Request body (JSON):
 *   { "name": "Ada L.", "email": "ada@ua.edu", "cohort": "2026-spring" }
 *
 * Response (200):
 *   { "ok": true, "message": "Check your email." }
 *
 * Rate limit: 3 requests per IP per hour (keyed in CLAIMS_KV).
 */

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COHORT_RE = /^[a-z0-9-]{2,32}$/;

async function checkRateLimit(ip, kv) {
  if (!kv) return true;
  const key = `rl:${ip}`;
  const raw = await kv.get(key);
  const count = raw ? parseInt(raw, 10) : 0;
  if (count >= 3) return false;
  await kv.put(key, String(count + 1), { expirationTtl: 3600 });
  return true;
}

async function sendEmail(env, { to, name, token }) {
  const link = `https://teachplay.dev/claim.html?t=${token}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111;">
  <p style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#888;margin:0 0 24px;">
    The University of Alabama · College of Education
  </p>
  <h1 style="font-size:26px;margin:0 0 16px;line-height:1.2;">
    Your credential is ready.
  </h1>
  <p style="font-size:16px;line-height:1.6;margin:0 0 24px;color:#333;">
    Hi ${name},<br/><br/>
    You have completed the <strong>AI-enhanced Educational Game Design</strong>
    microcredential. Click the button below to claim your signed credential.
    The link expires in 48 hours.
  </p>
  <a href="${link}"
     style="display:inline-block;background:#be1a2f;color:#fff;text-decoration:none;
            padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;">
    Claim credential →
  </a>
  <p style="margin:32px 0 0;font-size:13px;color:#888;line-height:1.6;">
    If you did not request this, you can safely ignore this email.<br/>
    Link: <a href="${link}" style="color:#888;">${link}</a>
  </p>
</body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'TeachPlay Credentials <credentials@teachplay.dev>',
      to: [to],
      subject: 'Claim your AI-enhanced Educational Game Design credential',
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error ${res.status}: ${err}`);
  }
  return res.json();
}

export async function handleEmailRequest(request, env) {
  if (request.method !== 'POST') return json({ error: 'POST required' }, 405);

  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  if (!await checkRateLimit(ip, env.CLAIMS_KV)) {
    return json({ error: 'Too many requests. Try again in an hour.' }, 429);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const name   = body.name   ? String(body.name).trim()                  : '';
  const email  = body.email  ? String(body.email).trim().toLowerCase()   : '';
  const cohort = body.cohort ? String(body.cohort).trim()                : '2026-spring';

  if (!name || name.length < 2) return json({ error: '`name` is required (min 2 chars)' }, 400);
  if (!EMAIL_RE.test(email))    return json({ error: 'Valid `email` is required' }, 400);
  if (!COHORT_RE.test(cohort))  return json({ error: '`cohort` must match [a-z0-9-]{2,32}' }, 400);
  if (!env.RESEND_API_KEY)      return json({ error: 'Email service not configured' }, 500);
  if (!env.CLAIMS_KV)           return json({ error: 'KV store not configured' }, 500);

  const token = crypto.randomUUID();
  const claim = { name, email, cohort, used: false, created: new Date().toISOString() };
  await env.CLAIMS_KV.put(`claim:${token}`, JSON.stringify(claim), { expirationTtl: 172800 });

  try {
    await sendEmail(env, { to: email, name, token });
  } catch (e) {
    return json({ error: 'Failed to send email', detail: e.message }, 500);
  }

  return json({ ok: true, message: 'Check your email — the link expires in 48 hours.' });
}
