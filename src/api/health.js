/**
 * GET /api/health — Worker smoketest.
 *
 * Confirms routing, runtime, and env bindings without touching crypto or
 * the @digitalbazaar stack. If this returns 200 but /api/sign-test does
 * not, the failure is library compatibility, not Worker setup.
 */
export async function handleHealth(request, env, ctx) {
  const body = {
    ok: true,
    runtime: 'cloudflare-workers',
    time: new Date().toISOString(),
    // Surfaces whether the secret landed, without echoing its value.
    env: {
      ISSUER_PRIVATE_KEY_JSON: env.ISSUER_PRIVATE_KEY_JSON ? 'set' : 'missing',
    },
    url: request.url,
    cf: {
      colo: request.cf?.colo || null,
      country: request.cf?.country || null,
    },
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
