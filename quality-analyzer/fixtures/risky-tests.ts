import { expect, test } from '@playwright/test';

test('test', async ({ page }) => {
  await page.waitForTimeout(500);
  await page.locator('.legacy-button').click();
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
});

test('submits a payment', async ({ page }) => {
  const sendPaymentButton = page.getByRole('button', { name: 'Send Payment' });
  await sendPaymentButton.click();
  await expect(page.getByText('Confirmation')).toBeVisible();
});

test('opens a new account', async ({ page }) => {
  const openAccountPage = {
    submit: async () => {},
    successHeading: page.getByRole('heading', { name: 'Account Opened' }),
  };
  await openAccountPage.submit();
  await expect(openAccountPage.successHeading).toBeVisible();
});

test('navigates without checking the result', async ({ page }) => {
  await page.goto('/overview');
});

test('empty placeholder', () => {});
