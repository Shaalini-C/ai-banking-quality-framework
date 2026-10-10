import { expect, test } from '@playwright/test';
import { FindTransactionsPage } from '../pages/FindTransactionsPage.js';
import { LoginPage } from '../pages/LoginPage.js';

test('displays transaction search filters for an available account', async ({
  page,
}) => {
  const loginPage = new LoginPage(page);
  const findTransactionsPage = new FindTransactionsPage(page);

  await loginPage.goto();

  // Arbitrary non-empty input only reaches the demo account area; it does not
  // verify credentials or authentication security.
  await loginPage.login('demo-user', 'demo-password');
  await page.locator('a[href="findtrans.htm"]').click();

  await expect(findTransactionsPage.heading).toBeVisible();
  await expect(findTransactionsPage.accountSelect).toBeVisible();
  await expect(findTransactionsPage.transactionIdInput).toBeVisible();
  await expect(findTransactionsPage.transactionDateInput).toBeVisible();
  await expect(findTransactionsPage.fromDateInput).toBeVisible();
  await expect(findTransactionsPage.toDateInput).toBeVisible();
  await expect(findTransactionsPage.amountInput).toBeVisible();
  await expect(findTransactionsPage.searchButtons).toHaveCount(4);

  await findTransactionsPage.selectAvailableAccount();
  await expect(findTransactionsPage.accountSelect).toHaveValue(/\S+/);

  // Do not issue a search: an invalid ID returned an application HTTP 500.
});
