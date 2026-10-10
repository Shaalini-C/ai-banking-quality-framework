import { expect, test } from '@playwright/test';

test('ParaBank landing page displays the customer login section', async ({ page }) => {
  await page.goto('https://parabank.parasoft.com/parabank/index.htm');

  await expect(page.getByRole('heading', { name: 'Customer Login' })).toBeVisible();
});
