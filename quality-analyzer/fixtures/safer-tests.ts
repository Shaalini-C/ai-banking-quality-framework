import { expect, test } from '@playwright/test';

test('waits for the overview heading without a fixed delay', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
});

test('uses a role-based locator for the visible control', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
});

test('checks the payment form without submitting a payment', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Bill Pay' })).toBeVisible();
});

test('checks account opening without creating a demo account', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Open New Account' })).toBeVisible();
});

test('asserts the overview after navigation', async ({ page }) => {
  await page.goto('/overview');
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
});

test('describes the expected overview behavior', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
});
