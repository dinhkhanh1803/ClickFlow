import { expect, test } from '@playwright/test';

import { mockCoreApi } from './core-api-mock';

test('signs in and completes the core Space, Folder, List, Task flow', async ({ page }) => {
  const api = await mockCoreApi(page);

  await page.goto('/login');
  await page.getByLabel('Email address').fill('khanh@clickflow.local');
  await page.getByLabel('Password').fill('Initial-Pass-9!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.context().addCookies([
    { name: 'clickflow_csrf', value: 'e2e-csrf-token', url: 'http://127.0.0.1:3000' },
    { name: 'clickflow_csrf', value: 'e2e-csrf-token', url: 'http://127.0.0.1:3002' }
  ]);

  await page.goto('/projects');
  await expect(page.getByRole('button', { name: 'Create a new Space' })).toBeVisible();

  await page.getByRole('button', { name: 'Create a new Space' }).click();
  await page.getByLabel('Space name').fill('Regression Space');
  await page.getByLabel('Space description').fill('E2E protected flow');
  await page.getByRole('button', { name: 'Can edit' }).click();
  await page.getByRole('button', { name: 'Create Space', exact: true }).click();

  await expect(page.getByRole('link', { name: 'Regression Space' })).toBeVisible();
  await expect(page.getByText('Created by Khanh')).toBeVisible();
  await expect(page.getByText('E2E protected flow')).toBeVisible();
  expect(api.createdWorkspaceRequests[0]).toMatchObject({ name: 'Regression Space', description: 'E2E protected flow', private: false, publicAccess: 'EDIT' });

  await page.getByRole('button', { name: 'Create in Regression Space' }).click();
  await page.getByRole('menuitem', { name: 'Folder' }).click();
  await page.getByLabel('folder name').fill('Launch Folder');
  await page.getByRole('button', { name: 'Create', exact: true }).click();

  const folderCard = page.getByRole('button', { name: /Launch Folder 1 lists/ });
  await expect(folderCard).toBeVisible();
  await folderCard.click();
  await expect(page.getByText('Regression Space / Launch Folder')).toBeVisible();
  await expect(page.getByRole('button', { name: /^List$/ }).first()).toBeVisible();

  await page.getByRole('button', { name: /^List$/ }).first().click();
  await expect(page.getByText('Regression Space / Launch Folder / List')).toBeVisible();
  await page.getByRole('button', { name: 'Add task in OPEN' }).click();
  await page.getByLabel('Task name').fill('Ship E2E guarded flow');
  await page.getByRole('button', { name: 'Save task' }).click();

  await expect(page.getByRole('button', { name: 'Ship E2E guarded flow' })).toBeVisible();
  expect(api.createdTaskRequests[0]).toMatchObject({ title: 'Ship E2E guarded flow', priority: 'NORMAL' });
});


test('private Space owner can invite an existing member by email', async ({ page }) => {
  const api = await mockCoreApi(page);

  await page.goto('/login');
  await page.getByLabel('Email address').fill('khanh@clickflow.local');
  await page.getByLabel('Password').fill('Initial-Pass-9!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.context().addCookies([
    { name: 'clickflow_csrf', value: 'e2e-csrf-token', url: 'http://127.0.0.1:3000' },
    { name: 'clickflow_csrf', value: 'e2e-csrf-token', url: 'http://127.0.0.1:3002' }
  ]);

  await page.goto('/projects');
  await page.getByRole('button', { name: 'Create a new Space' }).click();
  await page.getByLabel('Space name').fill('Private Collaboration');
  await page.getByRole('button', { name: 'Private' }).click();
  await page.getByRole('button', { name: 'Create Space', exact: true }).click();

  await expect(page.getByRole('link', { name: 'Private Collaboration' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Share' })).toBeVisible();
  await page.getByRole('button', { name: 'Share' }).click();
  await expect(page.getByRole('heading', { name: 'Share this Space' })).toBeVisible();
  await expect(page.getByText('Khanh', { exact: true })).toBeVisible();

  await page.getByLabel('Invite by name or email').fill('teammate@clickflow.local');
  await page.getByRole('button', { name: 'Invite' }).click();

  await expect(page.getByText('Teammate')).toBeVisible();
  expect(api.invitedMemberRequests[0]).toMatchObject({ email: 'teammate@clickflow.local', role: 'MEMBER' });
});


test('public view-only Space blocks create and task mutations', async ({ page }) => {
  const api = await mockCoreApi(page, { seedPublicViewSpace: true });

  await page.goto('/login');
  await page.getByLabel('Email address').fill('khanh@clickflow.local');
  await page.getByLabel('Password').fill('Initial-Pass-9!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.context().addCookies([
    { name: 'clickflow_csrf', value: 'e2e-csrf-token', url: 'http://127.0.0.1:3000' },
    { name: 'clickflow_csrf', value: 'e2e-csrf-token', url: 'http://127.0.0.1:3002' }
  ]);

  await page.goto('/projects?space=00000000-0000-4000-8000-000000000900');
  await expect(page.getByRole('link', { name: 'Public Readonly' })).toBeVisible();
  await expect(page.getByText('Created by Owner User')).toBeVisible();
  await expect(page.getByText('View only').first()).toBeVisible();

  await page.getByRole('button', { name: 'Create in Public Readonly' }).click();
  await page.getByRole('menuitem', { name: 'Folder' }).click();
  await expect(page.getByText('This public Space is view-only.')).toBeVisible();
  await expect(page.getByLabel('folder name')).toBeHidden();
  expect(api.createdProjectRequests).toHaveLength(0);

  await page.goto('/projects?space=00000000-0000-4000-8000-000000000900&folder=00000000-0000-4000-8000-000000000901&list=00000000-0000-4000-8000-000000000902');
  await expect(page.getByText('Public Readonly / Readonly Folder / Readonly List')).toBeVisible();
  await page.getByRole('button', { name: 'Add task in OPEN' }).click();
  await page.getByLabel('Task name').fill('Blocked task');
  await page.getByRole('button', { name: 'Save task' }).click();
  await expect(page.getByText('This public Space is view-only.')).toBeVisible();
  expect(api.createdTaskRequests).toHaveLength(0);
});


test('renders My Tasks, Calendar, and Settings from workspace data', async ({ page }) => {
  await mockCoreApi(page, { seedProductivityData: true });

  await page.goto('/login');
  await page.getByLabel('Email address').fill('khanh@clickflow.local');
  await page.getByLabel('Password').fill('Initial-Pass-9!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.context().addCookies([
    { name: 'clickflow_csrf', value: 'e2e-csrf-token', url: 'http://127.0.0.1:3000' },
    { name: 'clickflow_csrf', value: 'e2e-csrf-token', url: 'http://127.0.0.1:3002' }
  ]);

  await page.goto('/my-tasks');
  await expect(page.locator('h1').filter({ hasText: 'My Tasks' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Review productivity screens/ })).toBeVisible();

  await page.goto('/calendar');
  await expect(page.locator('h1').filter({ hasText: 'Calendar' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Review productivity screens/ })).toBeVisible();

  await page.goto('/settings');
  await expect(page.locator('h1').filter({ hasText: 'Settings' })).toBeVisible();
  await expect(page.getByText('khanh@clickflow.local')).toBeVisible();
  await expect(page.getByLabel('Time zone')).toHaveValue('Asia/Ho_Chi_Minh');
  await page.getByLabel('Locale').fill('en-US');
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect(page.getByText('Settings saved.')).toBeVisible();
});


