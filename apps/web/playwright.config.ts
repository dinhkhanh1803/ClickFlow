import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}{ext}',
  use: { baseURL: 'http://127.0.0.1:3002' },
  webServer: { command: 'pnpm exec next dev --port 3002', url: 'http://127.0.0.1:3002', reuseExistingServer: false },
});