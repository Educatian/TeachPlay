import { test, expect } from '@playwright/test';

const BASE = 'http://127.0.0.1:8765';

test('learner sign-in requests an email recovery link instead of pretending password auth is active', async ({ page }) => {
  let recoveryBody;
  let enrollCalled = false;
  await page.route('**/api/enroll', async (route) => {
    enrollCalled = true;
    await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'sign-in must not enroll' }) });
  });
  await page.route('**/api/progress', async (route) => {
    recoveryBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, recovery: true, message: 'Check your email for a one-time sign-in link.' }),
    });
  });

  await page.goto(BASE + '/index.html?landing=fidelity');
  await page.locator('button[aria-label*="learner account"]').click();
  await expect(page.locator('#auth-modal-title')).toHaveText('Welcome Back');
  await page.locator('#auth-email').fill('returning@example.edu');
  await expect(page.locator('#auth-password')).toBeHidden();
  await page.locator('form:has(#auth-email) button[type="submit"]').click();

  await expect(page.locator('[data-tp-auth-status]')).toContainText('Check your email');
  expect(recoveryBody).toEqual({ email: 'returning@example.edu' });
  expect(enrollCalled).toBe(false);
});

test('one-time recovery link seeds the learner token and reconnects the workspace', async ({ page }) => {
  await page.goto(BASE + '/app/?lid=learner-recovered&t=token-recovered', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  await expect.poll(() => page.evaluate(() => ({
    id: localStorage.getItem('hb:learner_id'),
    token: localStorage.getItem('hb:learner_token'),
  }))).toEqual({ id: 'learner-recovered', token: 'token-recovered' });
  await expect(page.locator('button[data-tp-auth-connected="true"]')).toHaveCount(1);
});

test('active consent gate surfaces the pre-survey from the connected learner workspace', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('hb:learner_id', 'learner-pre');
    localStorage.setItem('hb:learner_token', 'token-pre');
    localStorage.setItem('hb:learner_email', 'pre@example.edu');
    localStorage.setItem('hb:learner_name', 'Pre Test');
  });
  await page.route('**/api/completion-check?**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      ok: true, complete: false, count: 0, sessions: [],
      gate: { consent: { active: true, completed: false }, survey: { active: false, completed: null } },
    }) });
  });
  await page.route('**/api/survey-link?type=consent**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      ok: true, active: true, type: 'consent', link: 'https://survey.example/consent?learner_id=learner-pre',
    }) });
  });

  await page.goto(BASE + '/index.html?landing=fidelity');
  await expect(page.locator('#tp-presurvey-banner')).toContainText('pre-survey', { timeout: 7000 });
  await expect(page.locator('#tp-presurvey-banner a')).toHaveAttribute('href', /survey\.example/);
});
