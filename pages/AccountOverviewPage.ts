import type { Locator, Page } from '@playwright/test';

export class AccountOverviewPage {
  readonly heading: Locator;
  readonly accountsTable: Locator;
  readonly accountColumnHeader: Locator;
  readonly balanceColumnHeader: Locator;
  readonly availableAmountColumnHeader: Locator;

  constructor(page: Page) {
    this.heading = page.getByRole('heading', {
      name: 'Accounts Overview',
      level: 1,
    });
    this.accountsTable = page.getByRole('table');
    this.accountColumnHeader = page.getByRole('columnheader', {
      name: 'Account',
    });
    this.balanceColumnHeader = page.getByRole('columnheader', {
      name: 'Balance*',
    });
    this.availableAmountColumnHeader = page.getByRole('columnheader', {
      name: 'Available Amount',
    });
  }
}
