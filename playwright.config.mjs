import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // tests/unit/*.test.mjs are node:test unit tests (run via `npm run test:unit`),
  // not Playwright specs — keep Playwright from trying to execute them.
  testIgnore: '**/unit/**',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  // E2E specs that drive the prebuilt React bundle (e.g. the evidence editor's
  // guard/restore) are timing-sensitive under CI load; retry them there only.
  // Deterministic failures (selectors, missing elements) still fail every attempt.
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:8765',
    actionTimeout: 6_000,
    navigationTimeout: 15_000,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Make the gate self-contained: start the same static server the tests
  // expect. reuseExistingServer keeps a hand-started dev server working too.
  webServer: {
    command: 'python -m http.server 8765',
    url: 'http://127.0.0.1:8765/index.html',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
