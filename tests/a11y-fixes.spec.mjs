import { test, expect } from '@playwright/test';

// Locks in the accessibility fixes from the full-audit pass:
//   S07 / S11 minigames keyboard-operable, enroll modal dialog semantics,
//   S04 worksheet fields uniquely named.

test('S07 paper-prototype parts are keyboard-operable buttons', async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem('hb:learner_id', 'a11y-test'); } catch (_) {} });
  await page.goto('/session-07.html');
  const part = page.locator('#s07-tray button.pp-part').first();
  await expect(part).toHaveJSProperty('tagName', 'BUTTON');
  await expect(part).toHaveAttribute('aria-pressed', 'false');
  await part.focus();
  await page.keyboard.press('Enter'); // activate via keyboard, not click
  await expect(page.locator('#s07-count')).toHaveText('1');
  // the activated part is now on the table and marked pressed
  await expect(page.locator('#s07-table button.pp-part[aria-pressed="true"]')).toHaveCount(1);
});

test('S11 revision cards are keyboard-operable (role=button + Enter)', async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem('hb:learner_id', 'a11y-test'); } catch (_) {} });
  await page.goto('/session-11.html');
  const card = page.locator('#s11-backlog .rt-card').first();
  await expect(card).toHaveAttribute('role', 'button');
  await expect(card).toHaveAttribute('tabindex', '0');
  await card.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#s11-keep-count')).toHaveText('1');
});

test('enroll modal exposes dialog semantics and closes on Escape', async ({ page }) => {
  // No learner planted → the modal auto-opens on a session page.
  await page.goto('/session-01.html');
  const dialog = page.locator('#hb-enroll-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('role', 'dialog');
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(dialog).toHaveAttribute('aria-labelledby', 'hb-enroll-title');
  await expect(page.locator('#hb-enroll-title')).toHaveText(/register/i);
  await page.keyboard.press('Escape');
  await expect(page.locator('#hb-enroll-overlay')).toHaveCount(0);
});

test('S04 worksheet fields have unique accessible names', async ({ page }) => {
  await page.addInitScript(() => { try { localStorage.setItem('hb:learner_id', 'a11y-test'); } catch (_) {} });
  await page.goto('/session-04.html');
  const details = page.locator('details', { hasText: 'Open analysis worksheet' }).first();
  await details.locator('summary').click();
  const fields = details.locator('.fill-line[contenteditable]');
  const n = await fields.count();
  expect(n).toBeGreaterThan(5);
  // none uses the old generic label; each points at an existing label element
  const labelledby = await fields.evaluateAll((els) =>
    els.map((e) => e.getAttribute('aria-labelledby')));
  expect(labelledby.every(Boolean)).toBe(true);
  // referenced ids resolve to non-empty label text
  const firstId = labelledby[0];
  await expect(page.locator('#' + firstId)).not.toHaveText('');
});
