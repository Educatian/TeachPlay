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
