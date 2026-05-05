// smoke.spec.mjs — 10 functional checks against http://127.0.0.1:8765.
// Run: npx playwright test tests/smoke.spec.mjs --reporter=list
//
// Covers everything we just shipped — typewriter, lightbox, custom cursor,
// admin gate, annotation flow + drawer + download, achievement toast,
// Spot the Loop mini-game, game showcase + YouTube embeds, lightbox bug fix.

import { test, expect } from '@playwright/test';

const BASE = 'http://127.0.0.1:8765';

// Each test gets a fresh browser context by default — localStorage is already
// clean. We do NOT use addInitScript for clearing, because it re-runs on every
// navigation and would (a) wipe the synthetic learner the admin gate plants
// across the index → session-01 redirect, and (b) re-trigger the auto-shown
// enrollment modal on session pages mid-test.
//
// Helper: plant a synthetic learner so enroll.js skips the auto-modal. This
// keeps session-page tests focused on the feature under test.
async function asLearner(page) {
  await page.addInitScript(() => {
    try { localStorage.setItem('hb:learner_id', 'smoke-test'); } catch (_) {}
  });
}

test('1. landing page loads and hero typewriter reveals headline', async ({ page }) => {
  await page.goto(BASE + '/index.html');
  const h1 = page.locator('h1.hero__title[data-typewriter]');
  await expect(h1).toBeVisible();
  // After the typewriter completes (~2s), data-done flips to true.
  await expect(h1).toHaveAttribute('data-done', 'true', { timeout: 6000 });
  // The original text must be present.
  await expect(h1).toContainText('Design a game');
  await expect(h1).toContainText('teaches');
});

test('2. game showcase + Google AI Studio sections render with cards', async ({ page }) => {
  await page.goto(BASE + '/index.html');
  await expect(page.locator('#live-examples .showcase-card')).toHaveCount(8);
  await expect(page.locator('#ai-studio .showcase-card')).toHaveCount(8);
  // Featured workflow video is full-width with the ribbon.
  await expect(page.locator('#watch .video-card--featured')).toBeVisible();
  await expect(page.locator('#watch .video-card__featured-tag')).toContainText('Watch first');
  // Three YouTube iframes total.
  await expect(page.locator('#watch iframe')).toHaveCount(3);
});

test('3. lightbox opens on figure-image click and Escape closes', async ({ page }) => {
  await asLearner(page);
  await page.goto(BASE + '/session-03.html');
  const fig = page.locator('img.asset-figure__img').first();
  await expect(fig).toBeVisible();
  await fig.click();
  const overlay = page.locator('.hb-lightbox');
  await expect(overlay).toHaveAttribute('data-open', 'true');
  // Caption should pull from the <figcaption>
  await expect(page.locator('.hb-lightbox__cap')).not.toBeEmpty();
  await page.keyboard.press('Escape');
  await expect(overlay).not.toHaveAttribute('data-open', 'true');
});

test('4. lightbox bug-fix: page is clickable after closing the overlay', async ({ page }) => {
  await asLearner(page);
  await page.goto(BASE + '/session-03.html');
  await page.locator('img.asset-figure__img').first().click();
  await expect(page.locator('.hb-lightbox')).toHaveAttribute('data-open', 'true');
  await page.keyboard.press('Escape');
  // After close, an unrelated click on a header link should reach its target.
  // We assert by clicking the brand link and seeing navigation happen.
  const brandLink = page.locator('a.utility__brand').first();
  await expect(brandLink).toBeVisible();
  await brandLink.click();
  await page.waitForURL(/index\.html$/);
});

test('5. custom cursor mounts (dot + ring elements present)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(BASE + '/index.html');
  // hover-capable + viewport ≥ 720 + no reduced-motion: cursor should mount.
  await expect(page.locator('body.hb-cursor-on')).toHaveCount(1, { timeout: 3000 });
  await expect(page.locator('.hb-cursor-dot')).toHaveCount(1);
  await expect(page.locator('.hb-cursor-ring')).toHaveCount(1);
});

test('6. admin gate accepts the code and redirects into Session 01', async ({ page }) => {
  await page.goto(BASE + '/index.html');
  page.once('dialog', async (d) => {
    expect(d.type()).toBe('prompt');
    await d.accept('immersivebama');
  });
  await page.locator('#admin-gate-trigger').click();
  await page.waitForURL(/session-01\.html$/, { timeout: 5000 });
  // Synthetic learner planted; enrollment modal should NOT appear.
  await expect(page.locator('#hb-enroll-overlay')).toHaveCount(0);
  // hb:admin flag set.
  expect(await page.evaluate(() => localStorage.getItem('hb:admin'))).toBe('1');
});

test('7. annotation flow: select → highlight → persists across reload', async ({ page }) => {
  await asLearner(page);
  await page.goto(BASE + '/session-03.html');
  // Pick a deterministic chunk inside a known table cell.
  // Select the word "Procedural" by using a Range via evaluate.
  const selectionInfo = await page.evaluate(() => {
    const cell = document.querySelector('table td strong');
    if (!cell) return null;
    const range = document.createRange();
    range.selectNodeContents(cell);
    const sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(range);
    return cell.textContent;
  });
  expect(selectionInfo).toBeTruthy();
  // Selection toolbar should appear.
  const toolbar = page.locator('.hb-anno-toolbar');
  await expect(toolbar).toBeVisible();
  // Click "Highlight"
  await toolbar.locator('button[data-act="highlight"]').click();
  // A <mark> wrapping the selection should now exist.
  await expect(page.locator('mark.hb-anno-highlight')).toHaveCount(1);
  // Persistence: reload and check the highlight is restored.
  await page.reload();
  await expect(page.locator('mark.hb-anno-highlight')).toHaveCount(1);
});

test('8. note drawer opens, saves, and folds away after save', async ({ page }) => {
  await asLearner(page);
  await page.goto(BASE + '/session-03.html');
  // Make a selection and click "Note" to trigger the drawer flow.
  await page.evaluate(() => {
    const cell = document.querySelector('table td strong');
    const range = document.createRange();
    range.selectNodeContents(cell);
    const sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(range);
  });
  await page.locator('.hb-anno-toolbar button[data-act="note"]').click();
  const drawer = page.locator('.hb-anno-drawer');
  await expect(drawer).toHaveClass(/is-open/);
  await drawer.locator('textarea').fill('Test note from smoke suite.');
  await drawer.locator('button[data-act="save"]').click();
  // Drawer folds away.
  await expect(drawer).not.toHaveClass(/is-open/);
  // Note persisted on the record.
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('hb:annotations') || '[]'));
  expect(stored.length).toBe(1);
  expect(stored[0].note).toBe('Test note from smoke suite.');
});

test('9. annotation Markdown export downloads a file with notes inline', async ({ page }) => {
  await asLearner(page);
  await page.goto(BASE + '/session-03.html');
  // Seed an annotation via the public API (faster than re-driving UI).
  await page.evaluate(() => {
    const rec = {
      id: 'a_test', page: location.pathname, title: document.title,
      text: 'Procedural fluency', prefix: '', suffix: '',
      note: 'Watch for the speed-run gate.', ts: Date.now(),
    };
    localStorage.setItem('hb:annotations', JSON.stringify([rec]));
  });
  // Open the Notes panel and click Download all.
  await page.locator('#hb-anno-toggle').click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('.hb-anno-panel button[data-act="dl-all"]').click(),
  ]);
  const path = await download.path();
  const fs = await import('node:fs');
  const content = fs.readFileSync(path, 'utf8');
  expect(content).toContain('# TeachPlay annotations export');
  expect(content).toContain('Procedural fluency');
  expect(content).toContain('Watch for the speed-run gate.');
});

test('14. back-to-top button hides initially, appears after scroll, scrolls page back', async ({ page }) => {
  await asLearner(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(BASE + '/rubrics.html');
  const btn = page.locator('.hb-totop');
  await expect(btn).toHaveCount(1);
  // Initially hidden (not in is-on state)
  await expect(btn).not.toHaveClass(/is-on/);
  // Scroll down past 600px → button appears
  await page.evaluate(() => window.scrollTo(0, 1500));
  await expect(btn).toHaveClass(/is-on/);
  await btn.click();
  // After click, smooth scroll resolves; give it a beat then assert near top
  await page.waitForFunction(() => window.scrollY < 50, null, { timeout: 4000 });
});

test('15. theme-color meta is set on every page sample', async ({ page }) => {
  for (const path of ['/index.html', '/rubrics.html', '/session-03.html', '/404.html']) {
    await page.goto(BASE + path);
    const v = await page.locator('meta[name="theme-color"]').first().getAttribute('content');
    expect(v).toBe('#be1a2f');
  }
});

test('16. 404.html serves and offers four quick-link cards', async ({ page }) => {
  await page.goto(BASE + '/404.html');
  await expect(page.locator('h1.hero__title')).toContainText("compile");
  await expect(page.locator('.card-grid .card')).toHaveCount(4);
});

test('28. search dropdown surfaces matches across the site', async ({ page }) => {
  await page.goto(BASE + '/index.html');
  const input = page.locator('form.site-header__search input').first();
  // Trigger fetch + type
  await input.focus();
  await input.fill('cognitive load');
  // Wait for the debounced render
  const panel = page.locator('.hb-search-results.is-open');
  await expect(panel).toBeVisible({ timeout: 4000 });
  // At least one result should be the dedicated cognitive-load page
  await expect(panel.locator('a.hb-search-row[href="cognitive-load.html"]')).toHaveCount(1);
  // Esc closes
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
});

test('36. accessibility.html ships with conformance + known-issues + complaint mechanism', async ({ page }) => {
  await page.goto(BASE + '/accessibility.html');
  await expect(page.locator('h1.hero__title')).toContainText('What you can expect');
  // At least 4 status badges (ok / partial / known-issue chips) on the conformance list
  const badges = await page.locator('.a11y-status').count();
  expect(badges).toBeGreaterThan(4);
  // Complaint contact email
  await expect(page.locator('a[href="mailto:jmoon19@ua.edu"]').first()).toBeVisible();
});

test('37. privacy.html lists local + server data + FERPA notice + retention', async ({ page }) => {
  await page.goto(BASE + '/privacy.html');
  await expect(page.locator('h1.hero__title')).toContainText('FERPA');
  // Both data-collection tables
  const tables = await page.locator('table.pp-tbl').count();
  expect(tables).toBeGreaterThanOrEqual(3);
  // FERPA reference + retention
  await expect(page.locator('body')).toContainText(/FERPA/);
  await expect(page.locator('body')).toContainText(/retention/i);
});

test('38. skip-to-content link auto-injected on every page sample', async ({ page }) => {
  for (const path of ['/index.html', '/rubrics.html', '/handbook.html', '/session-03.html']) {
    await page.goto(BASE + path);
    const skip = page.locator('a.hb-skip').first();
    await expect(skip).toHaveCount(1);
    const href = await skip.getAttribute('href');
    expect(href).toBe('#main');
  }
});

test('39. footer auto-injects accessibility + privacy + source links', async ({ page }) => {
  await page.goto(BASE + '/index.html');
  const links = page.locator('.hb-footer-meta-links a');
  await expect(links).toHaveCount(3);
  await expect(page.locator('.hb-footer-meta-links a[href="accessibility.html"]')).toHaveCount(1);
  await expect(page.locator('.hb-footer-meta-links a[href="privacy.html"]')).toHaveCount(1);
});

test('40. Spot the Loop bank: reroll surfaces a fresh trio', async ({ page }) => {
  await page.goto(BASE + '/index.html');
  // Capture the first set of question IDs (data-id on cards)
  await expect(page.locator('.quickcheck__card')).toHaveCount(3);
  const firstSet = await page.locator('.quickcheck__card').evaluateAll(els => els.map(e => e.getAttribute('data-id')));
  // Answer all 3 cards (correct buttons) so the score widget shows + reroll appears
  for (const card of await page.locator('.quickcheck__card').all()) {
    await card.locator('button[data-correct="true"]').first().click();
  }
  // Click the new "Pull new items" button
  const reroll = page.locator('button[data-reroll]');
  await expect(reroll).toBeVisible();
  await reroll.click();
  // After reroll, fresh 3 cards rendered (likely all different IDs since 12-item bank)
  await expect(page.locator('.quickcheck__card')).toHaveCount(3);
  const secondSet = await page.locator('.quickcheck__card').evaluateAll(els => els.map(e => e.getAttribute('data-id')));
  // At least one ID should differ between sets (cooldown-driven)
  const overlap = firstSet.filter(id => secondSet.includes(id));
  expect(overlap.length).toBeLessThan(3);
});

test('41. achievements panel shows §6.2 caveat + mute toggle', async ({ page }) => {
  await page.goto(BASE + '/index.html');
  // Click the 🏆 badge to open the panel
  await page.locator('#hb-ach-toggle').click();
  await expect(page.locator('.hb-ach-panel.is-open')).toBeVisible();
  await expect(page.locator('.hb-ach-panel__caveat')).toContainText('§6.2');
  await expect(page.locator('button[data-mute]')).toBeVisible();
});

test('42. rubrics.html shows validity + calibration disclosure', async ({ page }) => {
  await page.goto(BASE + '/rubrics.html');
  const callout = page.locator('.validity-callout');
  await expect(callout).toBeVisible();
  await expect(callout).toContainText('Inter-rater agreement');
  await expect(callout).toContainText('Forthcoming');
});

test('33. sitemap.xml + robots.txt are served and reference each other', async ({ request }) => {
  const sm = await request.get(BASE + '/sitemap.xml');
  expect(sm.status()).toBe(200);
  const xml = await sm.text();
  expect(xml).toContain('<urlset');
  expect(xml).toContain('teachplay.dev/handbook.html');
  expect(xml).toContain('teachplay.dev/rubrics.html');
  const rb = await request.get(BASE + '/robots.txt');
  expect(rb.status()).toBe(200);
  const txt = await rb.text();
  expect(txt).toContain('Sitemap: https://teachplay.dev/sitemap.xml');
  expect(txt).toContain('Disallow: /admin.html');
});

test('34. references.html li items have anchor IDs (citation deep-linking)', async ({ page }) => {
  await page.goto(BASE + '/references.html');
  // All 29 li now have id="..."
  const withId = await page.locator('.ref-list li[id]').count();
  expect(withId).toBe(29);
  // A known ID resolves
  await expect(page.locator('#plass-2015')).toHaveCount(1);
});

test('35. handbook.html renders citations as clickable hb-cite spans', async ({ page }) => {
  await page.goto(BASE + '/handbook.html');
  // The v2 prose contains many "(Author, YYYY)" patterns. Wait for render + post-process.
  await page.waitForFunction(() => document.querySelectorAll('a.hb-cite').length > 5, null, { timeout: 8000 });
  const count = await page.locator('a.hb-cite').count();
  expect(count).toBeGreaterThan(5);
  // Hover one — should have a crimson dotted underline (visual style validated indirectly: href set)
  const first = page.locator('a.hb-cite').first();
  const href = await first.getAttribute('href');
  expect(href).toContain('references.html');
});

test('31. achievements list grew to 12 with handbook + search + Spot the Loop', async ({ page }) => {
  await page.goto(BASE + '/index.html');
  // Public API exposes the full list
  const ids = await page.evaluate(() => window.hbAchievements.all().map(a => a.id));
  expect(ids).toContain('first_search');
  expect(ids).toContain('handbook_reader');
  expect(ids).toContain('spot_the_loop');
  expect(ids.length).toBeGreaterThanOrEqual(12);
});

test('32. opening handbook.html unlocks the handbook_reader achievement', async ({ page }) => {
  await page.goto(BASE + '/handbook.html');
  // The unlock happens at DOMContentLoaded init() — give it a moment.
  await page.waitForFunction(
    () => (JSON.parse(localStorage.getItem('hb:achievements') || '[]')).includes('handbook_reader'),
    null, { timeout: 4000 }
  );
});

test('30. search hits text inside figure captions (e.g. "v1 v2 v3")', async ({ page }) => {
  // session-10's figcaption mentions "v1 → v2 → v3" — only reachable if the
  // index now includes figcaption text.
  await page.goto(BASE + '/index.html');
  const input = page.locator('form.site-header__search input').first();
  await input.focus();
  await input.fill('revision cycle');
  const panel = page.locator('.hb-search-results.is-open');
  await expect(panel).toBeVisible({ timeout: 4000 });
  // session-10 should be in the top results (its figure caption matches)
  await expect(panel.locator('a.hb-search-row[href="session-10.html"]')).toHaveCount(1);
});

test('29. search-index.json is served and contains every navigable page', async ({ request }) => {
  const resp = await request.get(BASE + '/search-index.json');
  expect(resp.status()).toBe(200);
  const idx = await resp.json();
  expect(Array.isArray(idx)).toBe(true);
  expect(idx.length).toBeGreaterThan(20);
  // Sanity-check a couple of expected pages
  const urls = idx.map(e => e.url);
  expect(urls).toContain('handbook.html');
  expect(urls).toContain('cognitive-load.html');
  expect(urls).toContain('references.html');
});

test('26. reading-time pill appears on long content pages', async ({ page }) => {
  await asLearner(page);
  await page.goto(BASE + '/session-03.html');
  // session-03 has the Crosswalk section + tables + figure → well above 300 words.
  const pill = page.locator('.hb-rtime');
  await expect(pill).toHaveCount(1);
  await expect(pill).toContainText(/min read/);
});

test('27. credential.html shows the ACHE funding acknowledgment with full name', async ({ page }) => {
  await page.goto(BASE + '/credential.html');
  const funding = page.locator('#funding');
  await expect(funding).toBeVisible();
  await expect(funding).toContainText('Alabama Commission on Higher Education');
  await expect(funding).toContainText('All-in-Alabama AI Microcredential');
});

test('24. handbook.html renders v2 markdown and builds a TOC', async ({ page }) => {
  await page.goto(BASE + '/handbook.html');
  // marked.js renders + we demote markdown H1→H2 so the page has exactly one
  // <h1> (visually hidden, screen-reader visible). Wait until at least the
  // first demoted H2 (was the doc title H1) shows up.
  await expect(page.locator('.hb-prose h2').first()).toContainText('Educational Game Design Micro-Credential', { timeout: 8000 });
  // Exactly one page-level H1 (a11y).
  await expect(page.locator('.hb-prose h1')).toHaveCount(1);
  // TOC populated (≥ 20 entries — v2 has many sections + sub-headings)
  const tocCount = await page.locator('#hb-toc-list a').count();
  expect(tocCount).toBeGreaterThan(20);
  // Download link is present and points at the markdown file.
  await expect(page.locator('a[href="handbook-v2.md"][download]')).toHaveCount(1);
});

test('25. handbook-v2.md is served at the repo root', async ({ request }) => {
  const resp = await request.get(BASE + '/handbook-v2.md');
  expect(resp.status()).toBe(200);
  const txt = await resp.text();
  expect(txt).toContain('Educational Game Design Micro-Credential');
  expect(txt.length).toBeGreaterThan(60_000);
});

test('19. references.html lists 29 sources + traceability table', async ({ page }) => {
  await page.goto(BASE + '/references.html');
  await expect(page.locator('.ref-list li')).toHaveCount(29);
  await expect(page.locator('.traceability tbody tr')).toHaveCount(9);
});

test('20. ai-use-policy.html shows permitted + not-permitted lists + disclosure', async ({ page }) => {
  await page.goto(BASE + '/ai-use-policy.html');
  await expect(page.locator('.policy-card.is-permit li')).toHaveCount(4);
  await expect(page.locator('.policy-card.is-deny li')).toHaveCount(4);
  await expect(page.locator('.disclosure ol li')).toHaveCount(3);
});

test('21. cognitive-load.html shows three-load grid + three tensions', async ({ page }) => {
  await page.goto(BASE + '/cognitive-load.html');
  await expect(page.locator('.load-card')).toHaveCount(3);
  await expect(page.locator('.tension')).toHaveCount(3);
});

test('22. facilitator.html now includes the workload + cohort sizing block', async ({ page }) => {
  await page.goto(BASE + '/facilitator.html');
  await expect(page.locator('.fg-workload')).toBeVisible();
  // Per-deliverable + cohort tables both rendered (5 D rows + 5 cohort rows)
  await expect(page.locator('.fg-workload__panel:nth-child(1) tbody tr')).toHaveCount(6); // 5 deliverables + total row
  await expect(page.locator('.fg-workload__panel:nth-child(2) tbody tr')).toHaveCount(5);
});

test('23. nav has new Resources entries on every regenerated page', async ({ page }) => {
  for (const path of ['/index.html', '/rubrics.html', '/session-03.html']) {
    await page.goto(BASE + path);
    // Menu items are present in DOM but hidden until the dropdown opens — use count + href.
    const items = page.locator('.primary-nav__group:nth-child(2) .primary-nav__panel a');
    await expect(items).toHaveCount(7);
    await expect(page.locator('.primary-nav a[href="references.html"]')).toHaveCount(1);
    await expect(page.locator('.primary-nav a[href="ai-use-policy.html"]')).toHaveCount(1);
    await expect(page.locator('.primary-nav a[href="cognitive-load.html"]')).toHaveCount(1);
  }
});

test('17. alignment.html shows the curriculum coverage matrix figure', async ({ page }) => {
  await page.goto(BASE + '/alignment.html');
  await expect(page.locator('img[src="assets/generated/alignment-coverage-matrix.webp"]')).toBeVisible();
});

test('18. facilitator.html shows the studio room photograph', async ({ page }) => {
  await page.goto(BASE + '/facilitator.html');
  await expect(page.locator('img[src="assets/generated/facilitator-studio.webp"]')).toBeVisible();
});

test('11. examples.html renders 3 worked-example figures (D2 / D3 / D5)', async ({ page }) => {
  await page.goto(BASE + '/examples.html');
  // Expect three new asset-figure images at the top of the artifact preview.
  await expect(page.locator('img[src="assets/generated/examples-d2-levels.webp"]')).toBeVisible();
  await expect(page.locator('img[src="assets/generated/examples-d3-prototype.webp"]')).toBeVisible();
  await expect(page.locator('img[src="assets/generated/examples-d5-spec.webp"]')).toBeVisible();
});

test('12. rubrics.html shows the non-compensatory floor diagram', async ({ page }) => {
  await page.goto(BASE + '/rubrics.html');
  await expect(page.locator('img[src="assets/generated/rubrics-floor-bars.webp"]')).toBeVisible();
});

test('13. og-image-v3 is referenced in meta tags and reachable', async ({ page, request }) => {
  await page.goto(BASE + '/index.html');
  const og = await page.locator('meta[property="og:image"]').getAttribute('content');
  const tw = await page.locator('meta[name="twitter:image"]').getAttribute('content');
  expect(og).toContain('og-image-v3.png');
  expect(tw).toContain('og-image-v3.png');
  // Confirm the file is actually served at the local server.
  const resp = await request.get(BASE + '/og-image-v3.png');
  expect(resp.status()).toBe(200);
});

test('10. Spot the Loop mini-game scores 3/3 when correct buttons clicked', async ({ page }) => {
  await page.goto(BASE + '/index.html');
  // For each of the 3 cards, click the button that has data-correct="true".
  const cards = page.locator('.quickcheck__card');
  await expect(cards).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    const card = cards.nth(i);
    await card.locator('button[data-correct="true"]').first().click();
    await expect(card).toHaveAttribute('data-state', 'correct');
  }
  // Score reveal shows 3.
  const score = page.locator('.quickcheck__score');
  await expect(score).toBeVisible();
  await expect(score.locator('[data-score]')).toHaveText('3');
});
