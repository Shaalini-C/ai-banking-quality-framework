import { expect, test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { TransferFundsPage } from '../pages/TransferFundsPage.js';

test('displays the transfer form with distinct available accounts', async ({
  page,
}) => {
  const loginPage = new LoginPage(page);
  const transferFundsPage = new TransferFundsPage(page);

  await loginPage.goto();

  // Arbitrary non-empty input only reaches the demo account area; it does not
  // verify credentials or authentication security.
  await loginPage.login('demo-user', 'demo-password');
  await page.locator('a[href="transfer.htm"]').click();

  await expect(transferFundsPage.heading).toBeVisible();
  await expect(transferFundsPage.amountInput).toBeVisible();
  await expect(transferFundsPage.fromAccountSelect).toBeVisible();
  await expect(transferFundsPage.toAccountSelect).toBeVisible();
  await expect(transferFundsPage.transferButton).toBeVisible();

  await transferFundsPage.selectDistinctAvailableAccounts();
  const fromAccount = await transferFundsPage.fromAccountSelect.inputValue();
  const toAccount = await transferFundsPage.toAccountSelect.inputValue();
  expect(fromAccount).not.toBe(toAccount);

  // Deliberately do not submit: this UI test must not move funds.
});
