/**
 * POST /api/admin/approve — approve a pending credential request.
 *
 * Auth: Authorization: Bearer <ISSUER_API_KEY>
 * Body: { "learner_id": "<uuid>" }
 *
 * Generates a one-time CLAIMS_KV token, sends the learner an email
 * with the claim link, and updates cred_status → 'issued'.
 */

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

async function sendClaimEmail(env, { to, name, token }) {
  const link = `https://teachplay.dev/claim.html?t=${token}`;
  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#111;">
  <p style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#888;margin:0 0 24px;">
    The University of Alabama · College of Education
  </p>
  <h1 style="font-size:26px;margin:0 0 16px;line-height:1.2;">Your credential is ready.</h1>
  <p style="font-size:16px;line-height:1.6;margin:0 0 24px;color:#333;">
    Hi ${name},<br/><br/>
    Your instructor has approved your <strong>AI-enhanced Educational Game Design</strong>
    microcredential. Click below to claim your signed credential. The link expires in 48 hours.
  </p>
  <a href="${link}" style="display:inline-block;background:#be1a2f;color:#fff;text-decoration:none;
     padding:14px 28px;border-radius:6px;font-size:15px;font-weight:600;">
    Claim credential →
  </a>
  <p style="margin:32px 0 0;font-size:13px;color:#888;line-height:1.6;">
    If you did not request this, ignore this email.<br/>
    Link: <a href="${link}" style="color:#888;">${link}</a>
  </p>
</body></html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'TeachPlay Credentials <credentials@teachplay.dev>',
      to: [to],
      subject: 'Your AI-enhanced Educational Game Design credential is approved',
      html,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

export async function handleAdminApprove(request, env) {
  if (request.method !== 'POST') return json({ error: 'POST required' }, 405);

  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ') || auth.slice(7) !== env.ISSUER_API_KEY) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const { learner_id } = body;
  if (!learner_id) return json({ error: 'learner_id required' }, 400);

  const learner = await env.DB.prepare(
    'SELECT id, name, email, cohort, cred_status FROM learners WHERE id = ?'
  ).bind(learner_id).first();

  if (!learner) return json({ error: 'Learner not found' }, 404);
  if (learner.cred_status === 'issued') return json({ error: 'Already issued' }, 409);

  const token = crypto.randomUUID();
  const claim = { name: learner.name, email: learner.email, cohort: learner.cohort, used: false, created: new Date().toISOString() };
  await env.CLAIMS_KV.put(`claim:${token}`, JSON.stringify(claim), { expirationTtl: 172800 });

  try {
    await sendClaimEmail(env, { to: learner.email, name: learner.name, token });
  } catch (e) {
    return json({ error: 'Email failed', detail: e.message }, 500);
  }

  await env.DB.prepare('UPDATE learners SET cred_status = ? WHERE id = ?').bind('issued', learner_id).run();

  return json({ ok: true, message: `Claim email sent to ${learner.email}` });
}
