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

test('1. root landing loads the React learner workspace', async ({ page }) => {
  await page.goto(BASE + '/index.html');
  await expect(page.locator('#root')).not.toBeEmpty({ timeout: 8000 });
  await expect(page.locator('body')).toContainText('TeachPlay', { timeout: 8000 });
  await expect(page.locator('body')).toContainText('AI-Enhanced Educational Game Design');
});

test('1b. React learner platform is reachable from the handbook domain', async ({ page }) => {
  await page.goto(BASE + '/app/');
  await expect(page.locator('#root')).not.toBeEmpty({ timeout: 8000 });
  await expect(page.locator('body')).toContainText('TeachPlay', { timeout: 8000 });
  await expect(page.locator('body')).toContainText('AI-Enhanced Educational Game Design');
});

test('1c. React create account registers through the TeachPlay enrollment API', async ({ page }) => {
  const learnerId = 'react-signup-test-learner';
  const email = 'react-signup@example.edu';
  let enrollPayload = null;

  await page.route('**/api/enroll', async (route) => {
    enrollPayload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        learner_id: learnerId,
        name: enrollPayload.name,
        cohort: enrollPayload.cohort,
        cred_status: 'none',
      }),
    });
  });

  await page.goto(BASE + '/index.html');
  await expect(page.locator('.tp-beginner-hero-cue')).toContainText('First time here?');
  await expect(page.locator('.tp-beginner-hero-cue')).toContainText('certificate requests are saved');
  await expect(page.getByRole('heading', { name: /Start here: create an account/i })).toBeVisible();
  await expect(page.getByText('The account step is what connects your progress')).toBeVisible();
  await page.locator('.tp-beginner-hero-cue [data-tp-action="hero-create-account"]').click();
  await expect(page.locator('#auth-modal-title')).toHaveText('Create Account');
  await page.locator('#auth-name').fill('React Signup');
  await page.locator('#auth-email').fill(email);
  await page.locator('#auth-password').fill('password123');
  await page.locator('form button[type="submit"]').click();

  await expect(page.getByRole('button', { name: /Sign Out/i })).toBeVisible({ timeout: 8000 });
  await expect(page.getByText('Account connected.')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Continue from the same learner workspace/i })).toBeVisible();
  expect(enrollPayload).toEqual({
    name: 'React Signup',
    email,
    cohort: '2026-spring',
  });
  const storedLearner = await page.evaluate(() => localStorage.getItem('hb:learner_id'));
  expect(storedLearner).toBe(learnerId);
});

test('2. handbook reference layer remains reachable from the unified site', async ({ page }) => {
  await page.goto(BASE + '/handbook.html');
  await expect(page.locator('h1')).toContainText('Course Handbook');
  await expect(page.locator('.primary-nav a[href="index.html"]')).toContainText('Start Learning');
  await expect(page.locator('.primary-nav a[href="session-01.html"]')).toContainText('Session Guides');
});

test('3. lightbox opens on figure-image click and Escape closes', async ({ page }) => {
  await asLearner(page);
  await page.goto(BASE + '/session-03.html');
  const fig = page.locator('img.asset-figure__img').first();
  await fig.scrollIntoViewIfNeeded();
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
  const fig = page.locator('img.asset-figure__img').first();
  await fig.scrollIntoViewIfNeeded();
  await fig.click();
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
  await page.goto(BASE + '/handbook.html');
  // hover-capable + viewport ≥ 720 + no reduced-motion: cursor should mount.
  await expect(page.locator('body.hb-cursor-on')).toHaveCount(1, { timeout: 3000 });
  await expect(page.locator('.hb-cursor-dot')).toHaveCount(1);
  await expect(page.locator('.hb-cursor-ring')).toHaveCount(1);
});

test.skip('6. legacy admin gate is no longer on the canonical learner landing', async () => {});

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
  await page.goto(BASE + '/handbook.html');
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

test('43. print stylesheet hides UI chrome and shows main content', async ({ page }) => {
  await page.goto(BASE + '/rubrics.html');
  // Switch to print emulation
  await page.emulateMedia({ media: 'print' });
  // Custom cursor + back-to-top + utility chrome should all be display:none
  await expect(page.locator('.hb-cursor-dot')).toBeHidden();
  await expect(page.locator('.hb-totop')).toBeHidden();
  await expect(page.locator('.primary-nav')).toBeHidden();
  // Main heading is still visible
  await expect(page.locator('h1.hero__title')).toBeVisible();
  await page.emulateMedia({ media: null });
});

test('44. focus-trap util is loaded site-wide', async ({ page }) => {
  await page.goto(BASE + '/handbook.html');
  const has = await page.evaluate(() => typeof window.hbFocusTrap === 'object' && typeof window.hbFocusTrap.trap === 'function');
  expect(has).toBe(true);
});

test('45. noscript fallback element exists on every sample page', async ({ page }) => {
  for (const path of ['/index.html', '/rubrics.html', '/handbook.html']) {
    await page.goto(BASE + path);
    // <noscript> content is parsed into a #shadow-equivalent; locator counts the wrapping div
    const ns = await page.locator('noscript').count();
    expect(ns).toBeGreaterThanOrEqual(1);
  }
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
  for (const path of ['/rubrics.html', '/handbook.html', '/session-03.html']) {
    await page.goto(BASE + path);
    const skip = page.locator('a.hb-skip').first();
    await expect(skip).toHaveCount(1);
    const href = await skip.getAttribute('href');
    expect(href).toBe('#main');
  }
});

test('39. footer auto-injects accessibility + privacy + source links', async ({ page }) => {
  await page.goto(BASE + '/handbook.html');
  const links = page.locator('.hb-footer-meta-links a');
  await expect(links).toHaveCount(3);
  await expect(page.locator('.hb-footer-meta-links a[href="accessibility.html"]')).toHaveCount(1);
  await expect(page.locator('.hb-footer-meta-links a[href="privacy.html"]')).toHaveCount(1);
});

test.skip('40. legacy Spot the Loop bank was removed from the canonical learner landing', async ({ page }) => {
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
  await page.goto(BASE + '/handbook.html');
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
  await page.goto(BASE + '/handbook.html');
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
  await page.goto(BASE + '/handbook.html');
  const input = page.locator('form.site-header__search input').first();
  await input.focus();
  await input.fill('revision cycle');
  const panel = page.locator('.hb-search-results.is-open');
  await expect(panel).toBeVisible({ timeout: 4000 });
  // session-10 should be in the top results (its figure caption matches)
  await expect(panel.locator('a.hb-search-row[href="session-10.html"]')).toHaveCount(1);
});

test('29. search-index.json is served, versioned, and contains every navigable page', async ({ request }) => {
  const resp = await request.get(BASE + '/search-index.json');
  expect(resp.status()).toBe(200);
  const data = await resp.json();
  // New envelope shape: { generated, count, pages: [...] }
  const idx = Array.isArray(data) ? data : data.pages;
  expect(idx.length).toBeGreaterThan(20);
  if (!Array.isArray(data)) {
    expect(typeof data.generated).toBe('string');
    expect(data.generated).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  }
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
  for (const path of ['/handbook.html', '/rubrics.html', '/session-03.html']) {
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

test('46. student completion guide embeds video, captions, narration, and downloads', async ({ page, request }) => {
  await page.goto(BASE + '/guides/student-completion-guide.html');
  await expect(page.getByRole('heading', { name: /From sign-in to certificate/i })).toBeVisible();
  await expect(page.locator('video[poster="/media/student-completion/teachplay-12-module-pathway.png"]')).toHaveCount(1);
  await expect(page.locator('video source[src="/media/student-completion/teachplay-student-completion-walkthrough.webm"]')).toHaveCount(1);
  await expect(page.locator('track[src="/media/student-completion/teachplay-student-completion-walkthrough.vtt"]')).toHaveCount(1);
  await expect(page.locator('audio source[src="/media/student-completion/teachplay-student-completion-walkthrough-narration.mp3"]')).toHaveCount(1);
  await expect(page.getByText('The WebM includes ElevenLabs neural narration audio')).toBeVisible();
  await expect(page.getByText('Use the 12-module sequence as the learning path.')).toBeVisible();
  await expect(page.locator('body')).toContainText('Portfolio checkpoints collect the evidence');
  await expect(page.locator('#downloads a')).toHaveCount(6);
  for (const asset of [
    '/media/student-completion/teachplay-12-module-pathway.png',
    '/media/student-completion/teachplay-student-completion-walkthrough.webm',
    '/media/student-completion/teachplay-student-completion-walkthrough.vtt',
    '/media/student-completion/teachplay-student-completion-walkthrough-narration.mp3'
  ]) {
    const response = await request.get(BASE + asset);
    expect(response.status(), asset).toBe(200);
  }
});

test('47. completed preview learner can reach certificate handoff', async ({ page }) => {
  await page.goto(BASE + '/index.html');
  await page.getByRole('button', { name: /Start learning/i }).click();
  await page.getByRole('button', { name: /Enter guided course/i }).click();
  for (let i = 0; i < 8; i++) {
    const complete = page.getByRole('button', { name: /Mark Complete|Next Lesson/i }).first();
    if ((await complete.count()) === 0) break;
    await complete.click();
  }
  await expect(page.getByRole('button', { name: /Get Certificate/i })).toBeVisible();
  await page.getByRole('button', { name: /Get Certificate/i }).click();
  await expect(page.getByText('Certificate of Completion')).toBeVisible();
  await expect(page.getByText('TP-PREVIEW-2026')).toBeVisible();
});

test('48. learner workspace exposes student guide and walkthrough links', async ({ page }) => {
  await page.goto(BASE + '/index.html');
  await expect(page.locator('nav .tp-student-guide-links')).toHaveCount(0);
  await expect(page.locator('nav')).not.toContainText('Student walkthrough');
  await expect(page.locator('nav')).not.toContainText('Sign In / Create Account');
  await expect(page.locator('nav button', { hasText: /^Sign In$/ })).toHaveCount(1);
  await expect(page.locator('a[href="/guides/student-completion-guide.html"]')).toHaveCount(1);
  await expect(page.locator('a[href="/media/student-completion/teachplay-student-completion-walkthrough.webm"]')).toHaveCount(1);
  await expect(page.locator('a[href="/media/student-completion/teachplay-student-completion-walkthrough.vtt"]')).toHaveCount(1);
  await expect(page.locator('a[href="/media/student-completion/teachplay-student-completion-walkthrough-narration.mp3"]')).toHaveCount(1);
});

test('49. guided course integrates 12 modules as curriculum and relabels milestones as checkpoints', async ({ page }) => {
  await page.goto(BASE + '/index.html');
  await page.getByRole('button', { name: /Start learning/i }).click();
  await page.getByRole('button', { name: /Enter guided course/i }).click();
  await expect(page.getByRole('heading', { name: /embedded 12-module sequence/i })).toBeVisible();
  await expect(page.locator('.tp12-course .tp12-module-card')).toHaveCount(12);
  await expect(page.locator('.tp12-sidebar-modules a')).toHaveCount(12);
  await expect(page.locator('.tp12-sidebar-modules a[href^="#tp12-module-"]')).toHaveCount(12);
  await expect(page.locator('.tp12-course .tp12-module-card a', { hasText: 'Focus module' })).toHaveCount(12);
  await expect(page.locator('.tp12-course .tp12-module-card a', { hasText: 'Handbook reference' })).toHaveCount(12);
  await expect(page.getByText('Portfolio checkpoint 1')).toBeVisible();
  await expect(page.getByText('Portfolio checkpoint 2')).toBeVisible();
  await expect(page.getByText('Portfolio checkpoint 3')).toBeVisible();
  await expect(page.getByText('The three items below are portfolio checkpoints, not the full curriculum.')).toBeVisible();
});

test('50. registered learner can complete sessions and request the credential', async ({ page }) => {
  const learnerId = 'journey-test-learner';
  const email = 'journey-test@example.edu';

  await page.route('**/api/enroll', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        learner_id: learnerId,
        name: 'Journey Test',
        cohort: '2026-spring',
        cred_status: 'none',
      }),
    });
  });

  await page.route('**/api/xapi', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, stored: 1 }),
    });
  });

  await page.route('**/api/completion-check?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, complete: false, count: 0, sessions: [] }),
    });
  });

  await page.route('**/api/email-request', async (route) => {
    const body = route.request().postDataJSON();
    expect(body.email).toBe(email);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        message: 'Request received. Your instructor will review and send your credential link by email.',
      }),
    });
  });

  await page.goto(BASE + '/session-01.html');
  await expect(page.getByRole('heading', { name: /Register to track your progress/i })).toBeVisible();
  await page.locator('#hb-enroll-name').fill('Journey Test');
  await page.locator('#hb-enroll-email').fill(email);
  await page.locator('#hb-enroll-btn').click();
  await expect(page.locator('#hb-enroll-overlay')).toHaveCount(0);

  for (let i = 1; i <= 12; i++) {
    const num = String(i).padStart(2, '0');
    await page.goto(BASE + `/session-${num}.html`);
    await page.evaluate(() => {
      document.querySelectorAll('.quiz__item').forEach((item) => {
        const option = item.querySelector('.quiz__opt:not([disabled])');
        if (option) option.click();
      });
    });
    const markDone = page.locator('[data-mark-done]').first();
    await expect(markDone).toBeVisible();
    await expect(markDone).not.toHaveClass(/quiz-gated-btn/);
    if (!(await markDone.textContent()).includes('Session complete')) {
      await markDone.click({ force: true });
    }
  }

  await expect(page.locator('#primary-cta')).toContainText(/Claim Credential/i);
  const completionState = await page.evaluate(() => ({
    done: JSON.parse(localStorage.getItem('hb:done') || '[]'),
    mirrored: localStorage.getItem('hb:session_complete:s12'),
    learnerId: localStorage.getItem('hb:learner_id'),
  }));
  expect(completionState.learnerId).toBe(learnerId);
  expect(completionState.done).toHaveLength(12);
  expect(completionState.mirrored).toBe('true');

  await page.goto(BASE + '/session-12.html#claim-credential');
  await expect(page.locator('#claim-ready')).toBeVisible();
  await expect(page.locator('#claim-gate')).toBeHidden();
  await page.locator('#claim-name').fill('Journey Test');
  await page.locator('#claim-email').fill(email);
  await page.locator('#claim-submit').click();
  await expect(page.locator('#claim-msg')).toContainText('Request received');
});

test('51. mobile learner can move from course structure to the first lesson', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.addInitScript(() => {
    localStorage.setItem('hb:learner_id', 'mobile-beginner');
  });
  await page.goto(BASE + '/index.html');
  await page.getByRole('button', { name: /Start learning/i }).click();
  await page.getByRole('button', { name: /Enter guided course/i }).click();
  await expect(page.locator('.tp12-sidebar-start')).toBeVisible();
  await expect(page.locator('.tp-beginner-toast')).toHaveCount(0);
  await page.locator('.tp12-sidebar-start').click();
  await expect(page.getByRole('heading', { name: 'Start with the Learning Problem', exact: true })).toBeVisible();
});

test.skip('10. legacy Spot the Loop mini-game was removed from the canonical learner landing', async ({ page }) => {
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
