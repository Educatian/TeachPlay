/**
 * GET /api/health — Worker smoketest.
 *
 * Confirms routing, runtime, and env bindings without touching crypto or
 * the @digitalbazaar stack. If this returns 200 but /api/sign-test does
 * not, the failure is library compatibility, not Worker setup.
 */
export async function handleHealth(request, env, ctx) {
  // Public, unauthenticated liveness check. Intentionally discloses nothing
  // about secret configuration or the request's edge location.
  const body = {
    ok: true,
    runtime: 'cloudflare-workers',
    time: new Date().toISOString(),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
