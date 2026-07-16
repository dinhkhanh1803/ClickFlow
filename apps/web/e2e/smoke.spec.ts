import { expect, test } from '@playwright/test';
test('login and dashboard shells load', async ({ page }) => { await page.goto('/login'); await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible(); await page.goto('/dashboard'); await expect(page.getByRole('heading', { name: 'Good morning, Khanh' })).toBeVisible(); });
