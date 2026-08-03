import { test, expect } from '@playwright/test';

const BASE = 'http://127.0.0.1:8765';

test('Google AI Studio playbook exposes prompts, integrations, and evidence visuals', async ({ page }) => {
  const failures = [];
  page.on('pageerror', (error) => failures.push(error.message));
  await page.goto(BASE + '/guides/google-ai-studio-playbook.html');
  await expect(page.getByRole('heading', { name: /From AI Studio prompt to a reviewable educational game/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Use Firebase when the game needs/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Use Google Workspace for review/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Playwright checks the shared game/i })).toBeVisible();
  await expect(page.locator('img[src*="google-ai-studio-build-to-submit"]')).toHaveCount(1);
  await expect(page.locator('img[src*="google-ai-studio-evidence-packet"]')).toHaveCount(1);
  expect(failures).toEqual([]);
});
