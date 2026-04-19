/**
 * teachplay Worker entry.
 *
 * Single fetch handler for the `teachplay` Worker on Cloudflare (Workers
 * with Static Assets). Requests flow:
 *   1. Match /api/* → dispatch to the corresponding handler in src/api/.
 *   2. Anything else → delegate to env.ASSETS.fetch() so the bound
 *      static bucket serves the repo's HTML / JSON / CSS / JS.
 *
 * The ASSETS binding is declared in wrangler.toml. Files that should
 * never be exposed to the public (node_modules, tools/, src/, docs/ …)
 * are listed in .assetsignore so they are not uploaded as assets.
 */
import { handleHealth } from './api/health.js';
import { handleIssue } from './api/issue.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // API routes — exact paths only; Cloudflare handles method restrictions
    // inside each handler.
    if (url.pathname === '/api/health') return handleHealth(request, env, ctx);
    if (url.pathname === '/api/issue') return handleIssue(request, env, ctx);

    // Anything else: fall through to static assets.
    return env.ASSETS.fetch(request);
  },
};
