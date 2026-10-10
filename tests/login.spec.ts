import { expect, test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';

test.describe('ParaBank customer login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('displays the customer login form', async () => {
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('shows a validation message when both login fields are blank', async () => {
    await loginPage.login('', '');

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toHaveText(
      'Please enter a username and password.',
    );
  });
});
