import { test, expect } from '@playwright/test';

// Verifies the three issues David reported:
//   S4  — worksheet fields are actually fillable
//   S7  — minigame instruction matches the tap/click behavior
//   S12 — evaluator degrades to self-score instead of a raw JS error

// Plant a synthetic learner so enroll.js skips the auto-modal that otherwise
// intercepts pointer events on session pages.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem('hb:learner_id', 'david-fixes-test'); } catch (_) {}
  });
});

test('S4 worksheet fill-lines are editable and persist', async ({ page }) => {
  await page.goto('/session-04.html');
  const details = page.locator('details', { hasText: 'Open analysis worksheet' }).first();
  await details.locator('summary').click();
  const field = details.locator('.fill-line[contenteditable]').first();
  await field.click();
  await field.type('discrimination');
  await expect(field).toHaveText('discrimination');
  // persistence: reload, reopen, value survives
  await page.reload();
  const details2 = page.locator('details', { hasText: 'Open analysis worksheet' }).first();
  await details2.locator('summary').click();
  await expect(details2.locator('.fill-line[contenteditable]').first()).toHaveText('discrimination');
});

test('S7 minigame instruction says tap, not drag, and clicking works', async ({ page }) => {
  await page.goto('/session-07.html');
  const lede = page.locator('.minigame__lede');
  await expect(lede).toBeVisible();
  await expect(lede).not.toContainText(/drag/i);
  // clicking a part moves it onto the table
  const firstPart = page.locator('#s07-tray .pp-part').first();
  await firstPart.click();
  await expect(page.locator('#s07-count')).toHaveText('1');
});

test('S12 evaluator degrades to self-score with no raw error', async ({ page }) => {
  // Ensure the sandbox bridge is absent, as on the live site.
  await page.addInitScript(() => { try { delete window.claude; } catch (e) { window.claude = undefined; } });
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  await page.goto('/session-12.html');
  await page.locator('#s12 textarea, #s12-questions textarea').first().fill('A specific behavior with specific evidence.');
  await page.locator('#s12-submit').click();
  const result = page.locator('#s12-result');
  await expect(result).toBeVisible();
  await expect(result).toContainText(/self-score/i);
  await expect(result).not.toContainText(/Cannot read properties|undefined/i);
  expect(pageErrors.join('\n')).not.toMatch(/Cannot read properties/i);
});
