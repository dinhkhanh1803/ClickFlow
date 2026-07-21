import { defineConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3002';
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1';

export default defineConfig({
  testDir: './e2e',
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}{ext}',
  use: { baseURL },
  ...(!skipWebServer ? {
    webServer: {
      command: `pnpm exec next dev --port ${new URL(baseURL).port || '3000'}`,
      url: baseURL,
      reuseExistingServer: process.env.CI !== 'true'
    }
  } : {})
});
