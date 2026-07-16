import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('dashboard has no automated accessibility violations', async ({ page }) => {
  await page.goto('/dashboard');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});