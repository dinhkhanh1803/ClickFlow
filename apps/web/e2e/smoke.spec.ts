import { expect, test } from '@playwright/test';
import { mockAuthenticatedSession } from './auth-fixture';

test('unauthenticated workspace access redirects to login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Work with more clarity.' })).toBeVisible();
});

test('an authenticated session can open the dashboard shell', async ({ page }) => {
  await mockAuthenticatedSession(page);
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Good morning, Khanh' })).toBeVisible();
});
