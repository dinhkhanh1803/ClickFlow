import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { mockAuthenticatedSession } from './auth-fixture';

test('dashboard has no automated accessibility violations', async ({ page }) => {
  await mockAuthenticatedSession(page);
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Good morning, Khanh' })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});