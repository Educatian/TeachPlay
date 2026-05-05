import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 20_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:8765',
    actionTimeout: 6_000,
    navigationTimeout: 8_000,
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
