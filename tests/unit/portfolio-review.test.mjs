import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { handlePortfolioReview, handleAdminPortfolioReview } from '../../src/api/portfolio-review.js';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

function request(method, body, headers = {}) {
  return new Request('https://teachplay.dev/api/portfolio-review', {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body == null ? undefined : JSON.stringify(body),
  });
}

function dbMock({ learner = { id: 'L1', session_token: 'tok' }, rows = [], changes = 1 } = {}) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      return {
        bind(...args) {
          calls.push({ sql, args });
          return {
            async first() {
              if (sql.includes('sqlite_master')) return { ok: 1 };
              if (sql.includes('FROM learners')) return learner;
              return null;
            },
            async all() { return { results: rows }; },
            async run() { return { success: true, meta: { changes } }; },
          };
        },
        async first() { return sql.includes('sqlite_master') ? { ok: 1 } : null; },
        async all() { return { results: rows }; },
      };
    },
  };
}

test('portfolio review rejects unsupported hosts before creating a queue row', async () => {
  const db = dbMock();
  const res = await handlePortfolioReview(request('POST', { url: 'https://example.com/private' }, { 'X-Learner-ID': 'L1', 'X-Learner-Token': 'tok' }), { DB: db });
  assert.equal(res.status, 400);
  assert.equal(db.calls.some((call) => /INSERT INTO portfolio_reviews/.test(call.sql)), false);
});

test('portfolio review accepts the canonical TeachPlay learner artifact host', async () => {
  const db = dbMock();
  const pending = [];
  const assets = { fetch: async () => new Response('<html><body>TeachPlay learner game</body></html>', { status: 200, headers: { 'content-type': 'text/html' } }) };
  const res = await handlePortfolioReview(request('POST', { url: 'https://teachplay.dev/app/?landing=fidelity' }, { 'X-Learner-ID': 'L1', 'X-Learner-Token': 'tok' }), { DB: db, ASSETS: assets }, { waitUntil: (work) => pending.push(work) });
  assert.equal(res.status, 202);
  await Promise.all(pending);
  assert.ok(db.calls.some((call) => /INSERT INTO portfolio_reviews/.test(call.sql)));
});

test('portfolio review stores conservative OpenRouter analysis and exposes it on GET', async () => {
  const rows = [];
  const db = dbMock({ rows });
  let openRouterRequest;
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).includes('openrouter.ai')) {
      openRouterRequest = JSON.parse(options.body);
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ learning_objective: 'Predict trajectories', computational_artifact_summary: 'A stateful projectile loop', observable_mechanics: ['angle input'], evidence_traces: ['revision trace'], alignment_findings: ['objective is observable'], trace_coverage: ['angle input is visible; revision history is not'], observability: ['A reviewer can see the final result but not the full state transition'], feedback_validity: ['feedback names the outcome but not the changed strategy'], assessment_validity: ['success is not yet tied to a criterion'], strengths: ['clear feedback'], risks: ['public link may hide runtime state'], evidence_questions: ['show the revision log'], finding_labels: ['observed', 'claimed', 'not_verifiable'], recommended_status: 'needs_review', rubric_hints: [{ deliverable: 'D2', rationale: 'links mechanic to objective' }] }) } }] }), { status: 200 });
    }
    return new Response('<html><body>prototype objective feedback revision<script>const state = "start"; function act(input) { return input ? "feedback" : state; }</script></body></html>', { status: 200, headers: { 'content-type': 'text/html' } });
  };
  const pending = [];
  const post = await handlePortfolioReview(request('POST', { url: 'https://aistudio.google.com/app/prompts/demo' }, { 'X-Learner-ID': 'L1', 'X-Learner-Token': 'tok' }), { DB: db, OPENROUTER_API_KEY: 'test-key' }, { waitUntil: (work) => pending.push(work) });
  assert.equal(post.status, 202);
  await Promise.all(pending);
  assert.equal(openRouterRequest.model, 'google/gemini-3.5-flash');
  assert.match(openRouterRequest.messages[1].content, /INLINE SCRIPT/);
  assert.match(openRouterRequest.messages[1].content, /const state/);
  assert.ok(db.calls.some((call) => /INSERT INTO portfolio_reviews/.test(call.sql)));
  assert.ok(db.calls.some((call) => /UPDATE portfolio_reviews SET status/.test(call.sql)));
});

test('admin portfolio review requires auth and only final-approves needs_review rows', async () => {
  const unauthorized = await handleAdminPortfolioReview(request('POST', { id: 'r1', action: 'final_approve' }), { DB: dbMock(), ISSUER_API_KEY: 'secret' });
  assert.equal(unauthorized.status, 401);
  const db = dbMock();
  const approved = await handleAdminPortfolioReview(request('POST', { id: 'r1', action: 'final_approve' }, { authorization: 'Bearer secret' }), { DB: db, ISSUER_API_KEY: 'secret' });
  assert.equal(approved.status, 200);
  assert.match((await approved.json()).next, /Submit rubric scores/);
});

test('admin portfolio review GET returns analysis rows with admin auth', async () => {
  const row = { id: 'r1', learner_id: 'L1', status: 'needs_review', analysis_json: JSON.stringify({ risks: ['show trace'] }) };
  const db = dbMock({ rows: [row] });
  const res = await handleAdminPortfolioReview(request('GET', null, { authorization: 'Bearer secret' }), { DB: db, ISSUER_API_KEY: 'secret' });
  assert.equal(res.status, 200);
  assert.deepEqual((await res.json()).reviews[0].analysis, { risks: ['show trace'] });
});

test('admin portfolio review accepts an allowlisted Cloudflare Access identity', async () => {
  const db = dbMock({ rows: [] });
  const res = await handleAdminPortfolioReview(request('GET', null, { 'CF-Access-Authenticated-User-Email': 'instructor@example.edu' }), { DB: db, ADMIN_ACCESS_EMAILS: 'instructor@example.edu' });
  assert.equal(res.status, 200);
});

test('admin portfolio review returns a clear 401 when Access session is missing', async () => {
  const res = await handleAdminPortfolioReview(request('GET'), { DB: dbMock() });
  assert.equal(res.status, 401);
  assert.match((await res.json()).error, /Cloudflare Access instructor session required/);
});
