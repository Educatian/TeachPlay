/**
 * teachplay Worker entry.
 *
 * Single fetch handler for the `teachplay` Worker on Cloudflare (Workers
 * with Static Assets). Requests flow:
 *   1. Match /api/* or /claim → dispatch to the corresponding handler.
 *   2. Anything else → delegate to env.ASSETS.fetch() so the bound
 *      static bucket serves the repo's HTML / JSON / CSS / JS.
 *
 * The ASSETS binding is declared in wrangler.toml. Files that should
 * never be exposed to the public (node_modules, tools/, src/, docs/ …)
 * are listed in .assetsignore so they are not uploaded as assets.
 */
import { handleHealth } from './api/health.js';
import { handleIssue } from './api/issue.js';
import { handleRevoke } from './api/revoke.js';
import { handleStatusList } from './api/status-list.js';
import { handleClaimCode } from './api/claim-code.js';
import { handleClaim } from './api/claim.js';
import { handleClaimPage } from './api/claim-page.js';
import { handleCertificate } from './api/certificate.js';
import { handleEmailRequest } from './api/email-request.js';
import { handleEmailVerify } from './api/email-verify.js';
import { handleVerifyCredential } from './api/verify-credential.js';
import { handleEnroll } from './api/enroll.js';
import { handleXapiCollect } from './api/xapi-collect.js';
import { handleAdminAnalytics } from './api/admin-analytics.js';
import { handleAdminApprove } from './api/admin-approve.js';
import { handleCompletionCheck } from './api/completion-check.js';
import { handleProgress } from './api/progress.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (p === '/api/health')     return handleHealth(request, env, ctx);
    if (p === '/api/issue')      return handleIssue(request, env, ctx);
    if (p === '/api/revoke')     return handleRevoke(request, env, ctx);
    if (p === '/api/claim-code') return handleClaimCode(request, env, ctx);
    if (p === '/api/claim')      return handleClaim(request, env, ctx);
    if (p === '/claim')          return handleClaimPage(request, env, ctx);
    if (p === '/certificate')       return handleCertificate(request, env, ctx);
    if (p === '/api/email-request')      return handleEmailRequest(request, env, ctx);
    if (p === '/api/email-verify')       return handleEmailVerify(request, env, ctx);
    if (p === '/api/verify-credential')  return handleVerifyCredential(request, env, ctx);
    if (p === '/api/enroll')             return handleEnroll(request, env, ctx);
    if (p === '/api/xapi')               return handleXapiCollect(request, env, ctx);
    if (p === '/api/admin/analytics')    return handleAdminAnalytics(request, env, ctx);
    if (p === '/api/admin/approve')      return handleAdminApprove(request, env, ctx);
    if (p === '/api/completion-check')   return handleCompletionCheck(request, env, ctx);
    if (p === '/api/progress')           return handleProgress(request, env, ctx);

    // /api/status-list/<cohort> — cohort is a path segment so the URL
    // is stable enough to embed in `credentialStatus.statusListCredential`.
    if (p.startsWith('/api/status-list/')) {
      const cohort = p.slice('/api/status-list/'.length);
      return handleStatusList(request, env, ctx, cohort);
    }

    // Anything else: fall through to static assets.
    return env.ASSETS.fetch(request);
  },
};
