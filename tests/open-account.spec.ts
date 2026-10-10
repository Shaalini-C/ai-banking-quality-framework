import { expect, test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { OpenAccountPage } from '../pages/OpenAccountPage.js';

test('opens a new checking account from an available funding account', async ({
  page,
}) => {
  const loginPage = new LoginPage(page);
  const openAccountPage = new OpenAccountPage(page);

  await loginPage.goto();

  // In this demo, arbitrary non-empty input was observed reaching the overview.
  // This is only a navigation setup and does not verify credentials or secure authentication.
  await loginPage.login('demo-user', 'demo-password');
  await page.getByRole('link', { name: 'Open New Account' }).click();

  await expect(openAccountPage.heading).toBeVisible();
  await openAccountPage.selectAccountType('CHECKING');
  await openAccountPage.selectAvailableFundingAccount();
  await openAccountPage.submit();

  await expect(openAccountPage.successHeading).toBeVisible();
  await expect(openAccountPage.confirmationMessage).toBeVisible();
  await expect(openAccountPage.newAccountNumberLink).toBeVisible();
  await expect(openAccountPage.newAccountNumberLink).toHaveAttribute(
    'href',
    /^activity\.htm\?id=\d+$/,
  );
});
