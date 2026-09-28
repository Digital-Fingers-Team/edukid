import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  workers: 1,
  use: {
    ...devices['Pixel 7'],
    baseURL: process.env.E2E_BASE ?? 'http://127.0.0.1:4173',
    locale: 'ar-EG',
    permissions: ['microphone'],
    launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
    trace: 'retain-on-failure',
  },
});
