import { expect, test } from '@playwright/test';
import { AccountOverviewPage } from '../pages/AccountOverviewPage.js';
import { LoginPage } from '../pages/LoginPage.js';

test('displays the Account Overview and its account table', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const accountOverviewPage = new AccountOverviewPage(page);

  await loginPage.goto();

  // The demo was observed opening the overview for arbitrary non-empty input;
  // this only reaches the page and does not verify credentials or secure auth.
  await loginPage.login('demo-user', 'demo-password');

  await expect(accountOverviewPage.heading).toBeVisible();
  await expect(accountOverviewPage.accountsTable).toBeVisible();
  await expect(accountOverviewPage.accountColumnHeader).toBeVisible();
  await expect(accountOverviewPage.balanceColumnHeader).toBeVisible();
  await expect(accountOverviewPage.availableAmountColumnHeader).toBeVisible();
});
