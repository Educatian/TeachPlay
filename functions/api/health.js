/**
 * Cloudflare Pages Function smoketest.
 *
 * Confirms Pages Functions are wired (routing, runtime, env binding).
 * Intentionally does no crypto / no bundling of heavy deps — if this
 * returns 200 but sign-test does not, the issue is library compatibility,
 * not the Pages setup itself.
 *
 * Route: GET /api/health
 */
export const onRequest = async (context) => {
  const body = {
    ok: true,
    runtime: 'cloudflare-pages-functions',
    time: new Date().toISOString(),
    // Surfaces whether the dashboard-side secret binding landed, without
    // ever echoing the value itself.
    env: {
      ISSUER_PRIVATE_KEY_JSON: context.env.ISSUER_PRIVATE_KEY_JSON ? 'set' : 'missing',
    },
    url: context.request.url,
    cf: {
      colo: context.request.cf?.colo || null,
      country: context.request.cf?.country || null,
    },
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
};
