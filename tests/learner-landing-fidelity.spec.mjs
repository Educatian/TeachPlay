import { test, expect } from '@playwright/test';

test('learner landing follows the current Figma Canvas composition', async ({ page }) => {
  await page.goto('/index.html?landing=fidelity');
  await page.locator('#tp-fidelity-landing').waitFor();
  await expect(page.locator('body')).toHaveClass(/tp-fidelity-mode/);

  await expect(page.locator('.tp-fidelity-hero h1')).toHaveText(/AI-enhancedEducationalGame Design/);
  await expect(page.locator('.tp-fidelity-card')).toContainText('A verifiable credential');
  await expect(page.locator('.tp-fidelity-card a')).toHaveAttribute('href', '/credential.html');
  await expect(page.locator('.tp-fidelity-outcome')).toContainText('Five evidence-ready deliverables');
  await expect(page.locator('.tp-fidelity-lede')).toContainText('educators and learning designers');
  await expect(page.locator('.tp-fidelity-stat')).toHaveCount(3);
  await expect(page.locator('.tp-fidelity-session')).toHaveCount(12);
  await expect(page.locator('.tp-fidelity-session.is-deliverable')).toHaveCount(3);
  await expect(page.locator('.tp-fidelity-session.is-deliverable').nth(0)).toHaveAttribute('href', '/session-07.html');
  await expect(page.locator('.tp-fidelity-session.is-deliverable').nth(0)).toContainText('Prototyping · D3');
  await expect(page.locator('.tp-fidelity-session.is-deliverable').nth(1)).toHaveAttribute('href', '/session-09.html');
  await expect(page.locator('.tp-fidelity-session.is-deliverable').nth(1)).toContainText('Playtesting · D4');
  await expect(page.locator('.tp-fidelity-review-band')).toBeVisible();
  await expect(page.locator('.tp-fidelity-review-band #tp-portfolio-review')).toBeVisible();
  await expect(page.locator('#tp-portfolio-review')).toHaveCount(1);
  await expect(page.locator('#tp-portfolio-access-note')).toContainText('sign in or enroll');
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

test('learner portfolio pre-review submits and renders bounded analysis', async ({ page }) => {
  let submitted;
  await page.addInitScript(() => {
    localStorage.setItem('hb:learner_id', 'learner-test');
    localStorage.setItem('hb:learner_token', 'token-test');
  });
  await page.route('**/api/portfolio-review', async (route) => {
    if (route.request().method() === 'POST') {
      submitted = route.request().postDataJSON();
      return route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ ok: true, status: 'analyzing' }) });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, reviews: [{ status: 'needs_review', provider: 'web-prototype', url: 'https://github.com/Educatian/TeachPlay', analysis: { computational_artifact_summary: 'State, input, feedback, and revision are observable.', evidence_traces: ['Revision log'], risks: ['Instructor must inspect the live artifact.'] } }] }),
    });
  });
  await page.goto('/index.html?landing=fidelity');
  await page.locator('#tp-portfolio-url').fill('https://github.com/Educatian/TeachPlay');
  await page.getByRole('button', { name: 'Submit for pre-review' }).click();
  await expect(page.getByText('State, input, feedback, and revision are observable.')).toBeVisible({ timeout: 5000 });
  expect(submitted).toEqual({ url: 'https://github.com/Educatian/TeachPlay' });
  await expect(page.locator('#tp-portfolio-review form')).toHaveAttribute('aria-busy', 'false');
});
