// a11y.spec.mjs — automated WCAG 2.1 AA scan via axe-core.
//
// Spot-checks 6 representative pages on desktop. Uses the official
// @axe-core/playwright integration. We tag-filter to wcag2a + wcag2aa +
// wcag21aa so the audit matches the page's stated conformance target.
//
// Failing on every violation would be too aggressive while we're still
// closing known issues — instead we count violations + assert no NEW
// regressions beyond a documented baseline. The baseline is updated when
// the team explicitly accepts a known issue (see accessibility.html).

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE = 'http://127.0.0.1:8765';

// Pages to scan — the same sample as the mobile audit, plus the two new
// compliance pages (accessibility, privacy) since they're explicitly the
// front door for accessibility-conscious visitors.
const PAGES = [
  '/index.html',
  '/rubrics.html',
  '/examples.html',
  '/handbook.html',
  '/session-03.html',
  '/credential.html',
  '/accessibility.html',
  '/privacy.html',
];

// Maximum allowed violations per page. 0 is the goal — we surface any new
// violations as a failure. Color-contrast on de-emphasized captions is the
// known partial-conformance area; if axe flags them, the failure is the
// alarm to fix them.
const MAX_VIOLATIONS = 0;

for (const path of PAGES) {
  test(`a11y · ${path}`, async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem('hb:learner_id', 'a11y-audit'); } catch (_) {}
    });
    await page.goto(BASE + path, { waitUntil: 'networkidle' });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      // Don't scan into 3rd-party iframes (YouTube embeds in particular —
      // we can't fix YouTube's internal a11y, and it pollutes our score).
      .exclude('iframe')
      // Disable rules we can't address page-by-page yet.
      .disableRules(['region']) // <main> wrapping is being added gradually
      .analyze();

    if (results.violations.length > 0) {
      console.log(`\n──── ${path} — ${results.violations.length} violation(s) ────`);
      for (const v of results.violations) {
        console.log(`  [${v.impact}] ${v.id}: ${v.help}`);
        console.log(`    ${v.helpUrl}`);
        v.nodes.slice(0, 3).forEach(n => {
          console.log(`    → ${n.target.join(' ')}`);
          if (n.failureSummary) console.log(`      ${n.failureSummary.split('\n').slice(0, 2).join(' / ')}`);
        });
      }
    }

    expect(results.violations.length, `axe found violations on ${path}`).toBeLessThanOrEqual(MAX_VIOLATIONS);
  });
}
