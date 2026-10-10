import type { Locator, Page } from '@playwright/test';

export class TransferFundsPage {
  readonly heading: Locator;
  readonly amountInput: Locator;
  readonly fromAccountSelect: Locator;
  readonly toAccountSelect: Locator;
  readonly transferButton: Locator;

  constructor(page: Page) {
    this.heading = page.getByRole('heading', {
      name: 'Transfer Funds',
      level: 1,
    });
    this.amountInput = page.locator('#amount');
    this.fromAccountSelect = page.locator('#fromAccountId');
    this.toAccountSelect = page.locator('#toAccountId');
    this.transferButton = page.getByRole('button', { name: 'Transfer' });
  }

  async selectDistinctAvailableAccounts(): Promise<void> {
    const fromOptions = this.fromAccountSelect.locator(
      'option[value]:not([value=""])',
    );
    const toOptions = this.toAccountSelect.locator(
      'option[value]:not([value=""])',
    );
    await fromOptions.first().waitFor({ state: 'attached' });
    await toOptions.first().waitFor({ state: 'attached' });

    const fromAccountValues = await this.fromAccountSelect
      .locator('option')
      .evaluateAll((options) =>
        options
          .map((option) => option.getAttribute('value'))
          .filter((value): value is string => value !== null && value !== ''),
      );
    const toAccountValues = await this.toAccountSelect
      .locator('option')
      .evaluateAll((options) =>
        options
          .map((option) => option.getAttribute('value'))
          .filter((value): value is string => value !== null && value !== ''),
      );

    const fromAccount = fromAccountValues[0];
    const toAccount = toAccountValues.find((value) => value !== fromAccount);
    if (!fromAccount || !toAccount) {
      throw new Error('Transfer requires two distinct available accounts.');
    }

    await this.fromAccountSelect.selectOption(fromAccount);
    await this.toAccountSelect.selectOption(toAccount);
  }
}
