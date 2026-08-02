import { test, expect } from '@playwright/test';

test('learner landing follows the current Figma Canvas composition', async ({ page }) => {
  await page.goto('/index.html?landing=fidelity');
  await page.locator('#tp-fidelity-landing').waitFor();
  await expect(page.locator('body')).toHaveClass(/tp-fidelity-mode/);

  await expect(page.locator('.tp-fidelity-hero h1')).toHaveText(/AI-enhancedEducationalGame Design/);
  await expect(page.locator('.tp-fidelity-card')).toContainText('A verifiable credential');
  await expect(page.locator('.tp-fidelity-card')).toContainText('Credential evidence packet');
  await expect(page.locator('.tp-fidelity-stat')).toHaveCount(3);
  await expect(page.locator('.tp-fidelity-session')).toHaveCount(12);
  await expect(page.getByRole('button', { name: /Start learning in Session 01/i })).toBeVisible();

  const desktop = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    bands: [...document.querySelectorAll('.tp-fidelity-brand-bar, .tp-bespoke-topnav, .tp-fidelity-hero, .tp-fidelity-proof, .tp-fidelity-pathway, .tp-fidelity-standards, .tp-fidelity-footer')]
      .map((node) => Math.round(node.getBoundingClientRect().height)),
    visibleLegacyCards: [...document.querySelectorAll('.tp-fidelity-legacy-card')]
      .filter((node) => node.getBoundingClientRect().height > 0).length,
  }));
  expect(desktop.overflow).toBe(false);
  expect(desktop.bands).toEqual([6, 60, 580, 240, 514, 240, 160]);
  expect(desktop.visibleLegacyCards).toBe(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#tp-fidelity-landing').waitFor();
  await expect(page.locator('body')).toHaveClass(/tp-fidelity-mode/);
  await expect(page.locator('.tp-fidelity-session')).toHaveCount(12);
  const mobile = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    heroColumns: getComputedStyle(document.querySelector('.tp-fidelity-hero-inner')).gridTemplateColumns,
    cardWidth: Math.round(document.querySelector('.tp-fidelity-card').getBoundingClientRect().width),
  }));
  expect(mobile.overflow).toBe(false);
  expect(mobile.heroColumns).not.toContain('480px');
  expect(mobile.cardWidth).toBeLessThanOrEqual(362);
});
