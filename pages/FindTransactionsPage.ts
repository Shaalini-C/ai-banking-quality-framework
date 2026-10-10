import type { Locator, Page } from '@playwright/test';

export class FindTransactionsPage {
  readonly heading: Locator;
  readonly accountSelect: Locator;
  readonly transactionIdInput: Locator;
  readonly transactionDateInput: Locator;
  readonly fromDateInput: Locator;
  readonly toDateInput: Locator;
  readonly amountInput: Locator;
  readonly searchButtons: Locator;

  constructor(page: Page) {
    this.heading = page.getByRole('heading', {
      name: 'Find Transactions',
      level: 1,
    });
    this.accountSelect = page.locator('#accountId');
    this.transactionIdInput = page.locator('#transactionId');
    this.transactionDateInput = page.locator('#transactionDate');
    this.fromDateInput = page.locator('#fromDate');
    this.toDateInput = page.locator('#toDate');
    this.amountInput = page.locator('#amount');
    this.searchButtons = page.getByRole('button', {
      name: 'Find Transactions',
    });
  }

  async selectAvailableAccount(): Promise<void> {
    const availableOptions = this.accountSelect.locator(
      'option[value]:not([value=""])',
    );
    await availableOptions.first().waitFor({ state: 'attached' });

    await this.accountSelect.selectOption({ index: 0 });
  }
}
