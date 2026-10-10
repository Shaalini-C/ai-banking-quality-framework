import { expect, test } from '@playwright/test';
import { BillPayPage } from '../pages/BillPayPage.js';
import { LoginPage } from '../pages/LoginPage.js';

test('displays the bill payment form and an available funding account', async ({
  page,
}) => {
  const loginPage = new LoginPage(page);
  const billPayPage = new BillPayPage(page);

  await loginPage.goto();

  // Arbitrary non-empty input only reaches the demo account area; it does not
  // verify credentials or authentication security.
  await loginPage.login('demo-user', 'demo-password');
  await page.locator('a[href="billpay.htm"]').click();

  await expect(billPayPage.heading).toBeVisible();
  await expect(billPayPage.payeeNameInput).toBeVisible();
  await expect(billPayPage.addressInput).toBeVisible();
  await expect(billPayPage.cityInput).toBeVisible();
  await expect(billPayPage.stateInput).toBeVisible();
  await expect(billPayPage.zipCodeInput).toBeVisible();
  await expect(billPayPage.phoneInput).toBeVisible();
  await expect(billPayPage.payeeAccountInput).toBeVisible();
  await expect(billPayPage.verifyAccountInput).toBeVisible();
  await expect(billPayPage.amountInput).toBeVisible();
  await expect(billPayPage.fromAccountSelect).toBeVisible();
  await expect(billPayPage.sendPaymentButton).toBeVisible();

  await billPayPage.selectAvailableFundingAccount();
  await expect(billPayPage.fromAccountSelect).toHaveValue(/\S+/);

  // Deliberately do not submit: this UI test must not send a payment.
});
