import { expect, test } from '@playwright/test';

test('dashboard light visual baseline', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard-light.png', { fullPage: true });
});

test('dashboard dark visual baseline', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard-dark.png', { fullPage: true });
});