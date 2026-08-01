import { test, expect } from '@playwright/test';

test('instructor review console loads analysis and final-approve action', async ({ page }) => {
  let action;
  let approved = false;
  await page.route('**/api/admin/portfolio-review', async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, reviews: approved ? [] : [{ id: 'r1', learner_id: 'L1', url: 'https://aistudio.google.com/app/prompts/demo', status: 'needs_review', created_at: '2026-08-01', analysis: { computational_artifact_summary: 'Stateful learning loop with observable feedback.', risks: ['Show revision trace.'] } }] }) });
    }
    action = route.request().postDataJSON();
    approved = true;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, id: 'r1', status: 'approved', next: 'Submit rubric scores, then issue credential.' }) });
  });
  await page.goto('/admin-review.html');
  await page.locator('#key').fill('test-only-key');
  await page.getByRole('button', { name: 'Load reviews' }).click();
  await expect(page.getByText('Stateful learning loop with observable feedback.')).toBeVisible();
  await page.getByRole('button', { name: 'Final approve' }).click();
  expect(action).toEqual({ id: 'r1', action: 'final_approve' });
  await expect(page.getByText('No portfolio reviews yet.')).toBeVisible();
});
