/**
 * POST /api/email-request — learner credential request (pending, not immediate).
 *
 * Looks up the learner in D1 by email. Sets cred_status = 'pending'.
 * Does NOT send an email — instructor must approve via /api/admin/approve.
 *
 * Body: { "name": "Ada L.", "email": "ada@ua.edu", "cohort": "2026-spring" }
 * Response: { "ok": true, "message": "..." }
 */

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function handleEmailRequest(request, env) {
  if (request.method !== 'POST') return json({ error: 'POST required' }, 405);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid JSON' }, 400); }

  const name  = body.name  ? String(body.name).trim()                : '';
  const email = body.email ? String(body.email).trim().toLowerCase() : '';

  if (!name || name.length < 2)  return json({ error: '`name` is required (min 2 chars)' }, 400);
  if (!EMAIL_RE.test(email))     return json({ error: 'Valid `email` is required' }, 400);
  if (!env.DB)                   return json({ error: 'Database not configured' }, 500);

  const learner = await env.DB.prepare(
    'SELECT id, cred_status FROM learners WHERE email = ?'
  ).bind(email).first();

  if (!learner) {
    return json({ error: 'No enrollment found for this email. Please register on the course page first.' }, 404);
  }
  if (learner.cred_status === 'issued') {
    return json({ ok: true, message: 'Your credential has already been issued. Check your email for the claim link.' });
  }
  if (learner.cred_status === 'pending') {
    return json({ ok: true, message: 'Your request is already pending instructor review. You will receive an email once approved.' });
  }

  await env.DB.prepare('UPDATE learners SET cred_status = ? WHERE id = ?')
    .bind('pending', learner.id).run();

  return json({ ok: true, message: 'Request received. Your instructor will review and send your credential link by email.' });
}
