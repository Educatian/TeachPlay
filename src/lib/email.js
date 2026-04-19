/**
 * Thin wrapper around the Resend HTTP API.
 *
 * All outbound mail flows through here so the from-address, envelope
 * shape, and error handling stay consistent. Callers pass a subject,
 * recipient, and already-rendered HTML body; the wrapper builds the
 * shared University-of-Alabama header + footer and dispatches.
 *
 * Returns nothing on success; throws on failure so callers can decide
 * whether to surface the error (admin approval) or swallow it
 * (fire-and-forget welcome / acknowledgement mail).
 */

const FROM = 'TeachPlay Credentials <credentials@teachplay.dev>';

function wrap(innerHtml) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111;">
  <p style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#888;margin:0 0 24px;">
    The University of Alabama · College of Education
  </p>
  ${innerHtml}
  <p style="margin:32px 0 0;font-size:12px;color:#aaa;line-height:1.6;border-top:1px solid #eee;padding-top:16px;">
    TeachPlay · AI-enhanced Educational Game Design<br/>
    <a href="https://teachplay.dev" style="color:#aaa;">teachplay.dev</a>
  </p>
</body></html>`;
}

export async function sendEmail(env, { to, subject, html }) {
  if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject,
      html: wrap(html),
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${await res.text()}`);
  }
}
