import type { Locator, Page } from '@playwright/test';

export type AccountType = 'CHECKING' | 'SAVINGS';

export class OpenAccountPage {
  readonly heading: Locator;
  readonly accountTypeSelect: Locator;
  readonly fundingAccountSelect: Locator;
  readonly submitButton: Locator;
  readonly successHeading: Locator;
  readonly confirmationMessage: Locator;
  readonly newAccountNumberLink: Locator;

  constructor(page: Page) {
    this.heading = page.getByRole('heading', {
      name: 'Open New Account',
      level: 1,
    });
    this.accountTypeSelect = page.locator('#type');
    this.fundingAccountSelect = page.locator('#fromAccountId');
    this.submitButton = page.getByRole('button', {
      name: 'Open New Account',
    });
    this.successHeading = page.getByRole('heading', {
      name: 'Account Opened!',
      level: 1,
    });
    this.confirmationMessage = page.getByText(
      'Congratulations, your account is now open.',
    );
    this.newAccountNumberLink = page.getByRole('link', {
      name: /^\d+$/,
    });
  }

  async selectAccountType(accountType: AccountType): Promise<void> {
    await this.accountTypeSelect.selectOption({ label: accountType });
  }

  async selectAvailableFundingAccount(): Promise<void> {
    await this.fundingAccountSelect.selectOption({ index: 0 });
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
