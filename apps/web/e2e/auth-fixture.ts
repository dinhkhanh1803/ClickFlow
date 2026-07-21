import type { Page } from '@playwright/test';

export async function mockAuthenticatedSession(page: Page) {
  await page.context().addCookies([{
    name: 'clickflow_csrf',
    value: 'e2e-csrf-token',
    url: 'http://127.0.0.1:3002'
  }, {
    name: 'clickflow_csrf',
    value: 'e2e-csrf-token',
    url: 'http://localhost:3000'
  }]);

  await page.route('http://localhost:3001/api/v1/auth/refresh', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'access-control-allow-origin': new URL(page.url()).origin,
        'access-control-allow-credentials': 'true'
      },
      body: JSON.stringify({
        accessToken: 'e2e-access-token',
        tokenType: 'Bearer',
        expiresIn: 900,
        csrfToken: 'e2e-csrf-token',
        user: {
          id: 'e2e-user',
          email: 'khanh@clickflow.local',
          displayName: 'Khanh',
          avatarUrl: null,
          timezone: 'Asia/Ho_Chi_Minh',
          locale: 'vi-VN'
        }
      })
    });
  });
}
