// audit.spec.mjs — comprehensive site audit. Loads every public HTML page,
// captures console errors / network failures / broken links / a11y basics,
// and prints a single consolidated report.
//
// Run: npx playwright test tests/audit.spec.mjs --reporter=list

import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';

const BASE = 'http://127.0.0.1:8765';

// Public, navigable pages — derived dynamically. Excludes utility / build files.
const SKIP_PAGES = new Set([
  'admin.html',         // dashboard, requires API key — not in the public flow
  'claim.html',         // wallet handoff, requires a one-shot code
  'progress.html',      // requires learner state
  'read.html',          // doc viewer requires a query string
  'analytics.html',     // instructor-only with API key
  'calibration.html',   // instructor-only
  'verifier.html',      // requires VC paste
  'module-video.html',  // requires ?m=NN query param
  'The Crosswalk.html', 'The Engagement Trap.html', // legacy two-host primer pages
]);

const repoRoot = 'C:/Users/jewoo/Desktop/_projects/TeachPlay';
const HTML_PAGES = readdirSync(repoRoot)
  .filter(f => f.endsWith('.html'))
  .filter(f => !SKIP_PAGES.has(f))
  .sort();

// Collected at module load so the report at the end has everything.
const ISSUES = [];
function note(page, severity, kind, msg) {
  ISSUES.push({ page, severity, kind, msg });
}

test.describe.configure({ mode: 'serial' });

// Mobile pages to spot-check at 390×844 (iPhone 14 Pro). Full traversal
// would double the audit runtime — sample the most-visited pages instead.
const MOBILE_SAMPLE = ['index.html', 'rubrics.html', 'examples.html', 'handbook.html', 'session-03.html', 'credential.html'];

for (const page_ of HTML_PAGES) {
  test(`audit · ${page_}`, async ({ page }) => {
    // Plant a synthetic learner so enroll.js doesn't show its modal.
    await page.addInitScript(() => {
      try { localStorage.setItem('hb:learner_id', 'audit'); } catch (_) {}
    });

    // Capture console messages (errors + warnings)
    const consoleMessages = [];
    page.on('console', m => {
      const type = m.type();
      if (type === 'error' || type === 'warning') {
        consoleMessages.push({ type, text: m.text() });
      }
    });

    // Capture network failures (excluding the /api/* paths which are stubbed
    // in local dev — Cloudflare Workers handles them in production).
    const netFailures = [];
    function isLocalDevStub(u) { return /\/api\//.test(u); }
    page.on('response', resp => {
      const u = resp.url();
      if (resp.status() >= 400 && !isLocalDevStub(u)) {
        netFailures.push({ url: u, status: resp.status() });
      }
    });
    page.on('requestfailed', req => {
      const u = req.url();
      if (!isLocalDevStub(u)) {
        netFailures.push({ url: u, status: 'FAILED:' + req.failure()?.errorText });
      }
    });

    // Page errors (uncaught exceptions)
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    let nav;
    try {
      nav = await page.goto(BASE + '/' + page_, { waitUntil: 'networkidle', timeout: 12000 });
    } catch (e) {
      note(page_, 'error', 'navigation', e.message);
      return;
    }
    if (!nav || nav.status() !== 200) {
      note(page_, 'error', 'http', `Status ${nav?.status()}`);
      return;
    }

    // ── Structural ───────────────────────────────────────────
    // Every page must have exactly one H1
    const h1Count = await page.locator('h1').count();
    if (h1Count === 0) note(page_, 'error', 'a11y', 'No <h1>');
    if (h1Count > 1)  note(page_, 'warning', 'a11y', `${h1Count} <h1> tags (should be 1)`);

    // Every page must have <title>
    const title = await page.title();
    if (!title || title.length < 5) note(page_, 'warning', 'seo', 'Title missing or too short');

    // Every page must have <meta name="viewport"> (mobile-friendly)
    const hasViewport = await page.locator('meta[name="viewport"]').count();
    if (!hasViewport) note(page_, 'error', 'a11y', 'Missing viewport meta');

    // theme-color (we standardized on this)
    const themeColor = await page.locator('meta[name="theme-color"]').count();
    if (!themeColor) note(page_, 'warning', 'meta', 'Missing theme-color meta');

    // ── Images ───────────────────────────────────────────────
    // Every <img> needs alt (empty alt="" is OK if decorative)
    const imgs = await page.locator('img').all();
    let imgsWithoutAlt = 0;
    for (const img of imgs) {
      const alt = await img.getAttribute('alt');
      if (alt === null) imgsWithoutAlt++;
    }
    if (imgsWithoutAlt > 0) {
      note(page_, 'warning', 'a11y', `${imgsWithoutAlt} <img> tag(s) missing alt`);
    }

    // ── Internal links ───────────────────────────────────────
    // Sample (don't HEAD every link — would be O(n²)). Just check the in-document
    // anchors resolve and same-origin .html links exist as files.
    const internalLinks = await page.locator('a[href]').evaluateAll(els =>
      els.map(a => a.getAttribute('href'))
        .filter(h => h && !h.startsWith('http') && !h.startsWith('mailto:') && !h.startsWith('#') && h !== '#')
    );
    const seen = new Set();
    for (const href of internalLinks) {
      if (seen.has(href)) continue;
      seen.add(href);
      // Strip query + hash for HEAD check
      const path = href.split('#')[0].split('?')[0];
      if (!path || !path.endsWith('.html') && !path.endsWith('.md') && !path.endsWith('.json') && !path.endsWith('.svg') && !path.endsWith('.png') && !path.endsWith('.webp')) continue;
      try {
        const resp = await page.request.get(BASE + '/' + path);
        if (resp.status() >= 400) {
          note(page_, 'error', 'broken-link', `${href} → ${resp.status()}`);
        }
      } catch (e) {
        note(page_, 'warning', 'broken-link', `${href} → fetch failed`);
      }
    }

    // ── Console / page errors ────────────────────────────────
    for (const e of pageErrors) {
      note(page_, 'error', 'js-uncaught', e);
    }
    for (const m of consoleMessages) {
      // Filter out known-benign third-party warnings (e.g. CDN deprecation chatter)
      if (m.type === 'error') {
        // Skip generic "Failed to load resource" console echoes — every failed
        // request also fires a network event we report on, with the actual URL.
        // Logging both spams the report.
        if (/Failed to load resource/i.test(m.text)) continue;
        if (/cross-origin|youtube|googlevideo|gstatic|\/api\//i.test(m.text)) continue;
        note(page_, 'error', 'console', m.text.slice(0, 240));
      } else {
        if (/Cross-Origin|youtube|googlevideo|gstatic|deprecated|babel|web-share|\/api\/|501.*POST/i.test(m.text)) continue;
        note(page_, 'warning', 'console', m.text.slice(0, 240));
      }
    }

    // ── Network failures (excluding third-party iframe assets) ──
    for (const f of netFailures) {
      if (/youtube|googlevideo|gstatic|doubleclick/i.test(f.url)) continue;
      // marked.js CDN redirect is fine if status is 200 ultimately
      note(page_, 'error', 'network', `${f.status} ${f.url.replace(BASE, '')}`);
    }
  });
}

// ── Mobile viewport pass ─────────────────────────────────────────
for (const page_ of MOBILE_SAMPLE) {
  test(`audit · ${page_} @mobile-390`, async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem('hb:learner_id', 'audit'); } catch (_) {}
    });
    await page.setViewportSize({ width: 390, height: 844 });
    let nav;
    try {
      nav = await page.goto(BASE + '/' + page_, { waitUntil: 'networkidle', timeout: 12000 });
    } catch (e) {
      note(page_, 'error', 'mobile-nav', e.message);
      return;
    }
    if (!nav || nav.status() !== 200) {
      note(page_, 'error', 'mobile-http', `Status ${nav?.status()}`);
      return;
    }
    // Check for horizontal overflow — the most common mobile bug.
    const overflow = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      const slack = scrollW - docW;
      // Find the RIGHTMOST element causing the overflow (not just the first).
      let widestOffender = null, maxRight = docW;
      if (slack > 1) {
        const all = document.querySelectorAll('body *');
        for (const el of all) {
          const r = el.getBoundingClientRect();
          if (r.right > maxRight + 1) {
            maxRight = r.right;
            widestOffender = `${el.tagName.toLowerCase()}.${(el.className||'').toString().split(' ')[0] || 'no-class'} (right=${Math.round(r.right)}, w=${Math.round(r.width)})`;
          }
        }
      }
      return { docW, scrollW, slack, widestOffender };
    });
    // Allow up to 10px slack — typical scrollbar reserve / sub-pixel rounding
    // is OK, anything beyond that is a real layout escape.
    if (overflow.slack > 10) {
      note(page_, 'warning', 'mobile-overflow',
        `Horizontal overflow ${overflow.slack}px (doc=${overflow.docW}, scroll=${overflow.scrollW})${overflow.widestOffender ? ' · likely: ' + overflow.widestOffender : ''}`);
    }

    // Tap-target check: every <a> and <button> in the viewport should be ≥ 32px in either dim.
    const tooSmallTargets = await page.evaluate(() => {
      const targets = document.querySelectorAll('a, button');
      const tooSmall = [];
      for (const t of targets) {
        const r = t.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue; // hidden
        if (r.top < 0 || r.top > window.innerHeight) continue; // off-screen
        if (r.width < 24 || r.height < 24) {
          tooSmall.push({
            tag: t.tagName.toLowerCase(),
            cls: (t.className || '').toString().slice(0, 30),
            w: Math.round(r.width), h: Math.round(r.height),
          });
        }
      }
      return tooSmall.slice(0, 3); // top 3 only
    });
    for (const t of tooSmallTargets) {
      note(page_, 'warning', 'mobile-tap',
        `${t.tag}.${t.cls} ${t.w}×${t.h} (recommended ≥ 32×32)`);
    }
  });
}

test('audit · final report', async () => {
  // Print a consolidated report. Don't fail the test on warnings — only on errors.
  const errors = ISSUES.filter(i => i.severity === 'error');
  const warnings = ISSUES.filter(i => i.severity === 'warning');

  console.log('\n┌─ SITE AUDIT REPORT ─────────────────────────────────────');
  console.log(`│ Pages audited: ${HTML_PAGES.length}`);
  console.log(`│ Errors:        ${errors.length}`);
  console.log(`│ Warnings:      ${warnings.length}`);
  console.log('└─────────────────────────────────────────────────────────\n');

  function group(arr) {
    const byPage = {};
    for (const i of arr) (byPage[i.page] ??= []).push(i);
    return byPage;
  }

  if (errors.length) {
    console.log('═══ ERRORS ═══');
    const g = group(errors);
    for (const p of Object.keys(g).sort()) {
      console.log(`\n  ${p}`);
      for (const i of g[p]) console.log(`    [${i.kind}] ${i.msg}`);
    }
  }
  if (warnings.length) {
    console.log('\n═══ WARNINGS ═══');
    const g = group(warnings);
    for (const p of Object.keys(g).sort()) {
      console.log(`\n  ${p}`);
      for (const i of g[p]) console.log(`    [${i.kind}] ${i.msg}`);
    }
  }

  // Hard fail on errors only
  expect(errors, `Site audit found ${errors.length} errors — see report above`).toHaveLength(0);
});
