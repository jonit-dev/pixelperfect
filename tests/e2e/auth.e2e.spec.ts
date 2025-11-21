import { test } from '@playwright/test';

import { LoginPage } from '../pages/LoginPage';

test.describe('Authentication', () => {
  test('should show login form', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto('/');
    await loginPage.openLoginModal();
    await loginPage.assertModalVisible();
  });
});
