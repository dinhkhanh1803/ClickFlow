import { expect, test } from '@playwright/test';
import { Buffer } from 'node:buffer';

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required to run the real API authenticated E2E test.`);
  return value;
}

test('authenticated user completes Space, Folder, List, Task, and attachment flow against the real API', async ({ page }) => {
  test.setTimeout(90_000);
  const demoEmail = requireEnv('E2E_USER_EMAIL');
  const demoPassword = requireEnv('E2E_USER_PASSWORD');
  const suffix = Date.now().toString(36);
  const spaceName = `Real API Space ${suffix}`;
  const folderName = `Real API Folder ${suffix}`;
  const taskName = `Real API Task ${suffix}`;
  const attachmentName = `real-api-attachment-${suffix}.md`;

  await page.goto('/login');
  await page.getByLabel('Email address').fill(demoEmail);
  await page.getByLabel('Password').fill(demoPassword);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto('/projects');
  await expect(page.getByRole('button', { name: 'Create a new Space' })).toBeVisible();
  const autoRefreshToggle = page.getByRole('button', { name: 'Auto refresh: On' });
  if (await autoRefreshToggle.isVisible()) await autoRefreshToggle.click();

  await page.getByRole('button', { name: 'Create a new Space' }).click();
  await page.getByLabel('Space name').fill(spaceName);
  await page.getByLabel('Space description').fill('PostgreSQL-backed E2E flow');
  await page.getByRole('button', { name: 'Create Space', exact: true }).click();

  await expect(page.getByRole('link', { name: spaceName })).toBeVisible();
  await expect(page.getByText('PostgreSQL-backed E2E flow')).toBeVisible();

  await page.getByRole('button', { name: `Create in ${spaceName}` }).click();
  await page.getByRole('menuitem', { name: 'Folder' }).click();
  await page.getByLabel('folder name').fill(folderName);
  await page.getByRole('button', { name: 'Create', exact: true }).click();

  const folderCard = page.getByRole('button', { name: new RegExp(`${folderName} 1 lists?`) });
  await expect(folderCard).toBeVisible();
  await folderCard.click();

  await expect(page.getByText(`${spaceName} / ${folderName}`)).toBeVisible();
  await page.getByRole('button', { name: /^List$/ }).first().click();
  await expect(page.getByText(new RegExp(`${spaceName} / ${folderName} / List`))).toBeVisible();

  await page.getByRole('button', { name: 'Add task in OPEN' }).click();
  await page.getByLabel('Task name').fill(taskName);
  await page.getByRole('button', { name: 'Save task' }).click();

  await expect(page.getByRole('button', { name: taskName })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: taskName })).toBeVisible();

  await page.getByRole('button', { name: taskName }).click();
  await page.getByLabel('Add attachment').setInputFiles({
    name: attachmentName,
    mimeType: 'text/markdown',
    buffer: Buffer.from(`# Cloudinary E2E\n\n${taskName}\n`)
  });
  await expect(page.getByText('Attachment uploaded.')).toBeVisible();
  await expect(page.getByRole('button', { name: `Preview attachment ${attachmentName}` })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: `Preview attachment ${attachmentName}` }).click();
  await expect(page.getByRole('dialog', { name: 'Attachment preview' })).toBeVisible();
  await expect(page.getByText('Cloudinary E2E')).toBeVisible();

  const openOriginal = page.getByRole('link', { name: 'Open original' });
  await expect(openOriginal).toBeVisible();
  const downloadUrl = await openOriginal.getAttribute('href');
  expect(downloadUrl).toBeTruthy();
  const downloadResponse = await page.request.get(downloadUrl!);
  expect(downloadResponse.ok()).toBeTruthy();
});