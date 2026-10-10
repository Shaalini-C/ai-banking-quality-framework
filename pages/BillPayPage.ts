import type { Locator, Page } from '@playwright/test';

export class BillPayPage {
  readonly heading: Locator;
  readonly payeeNameInput: Locator;
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly zipCodeInput: Locator;
  readonly phoneInput: Locator;
  readonly payeeAccountInput: Locator;
  readonly verifyAccountInput: Locator;
  readonly amountInput: Locator;
  readonly fromAccountSelect: Locator;
  readonly sendPaymentButton: Locator;

  constructor(page: Page) {
    this.heading = page.getByRole('heading', {
      name: 'Bill Payment Service',
      level: 1,
    });
    this.payeeNameInput = page.locator('input[name="payee.name"]');
    this.addressInput = page.locator('input[name="payee.address.street"]');
    this.cityInput = page.locator('input[name="payee.address.city"]');
    this.stateInput = page.locator('input[name="payee.address.state"]');
    this.zipCodeInput = page.locator('input[name="payee.address.zipCode"]');
    this.phoneInput = page.locator('input[name="payee.phoneNumber"]');
    this.payeeAccountInput = page.locator('input[name="payee.accountNumber"]');
    this.verifyAccountInput = page.locator('input[name="verifyAccount"]');
    this.amountInput = page.locator('input[name="amount"]');
    this.fromAccountSelect = page.locator('select[name="fromAccountId"]');
    this.sendPaymentButton = page.getByRole('button', {
      name: 'Send Payment',
    });
  }

  async selectAvailableFundingAccount(): Promise<void> {
    const availableOptions = this.fromAccountSelect.locator(
      'option[value]:not([value=""])',
    );
    await availableOptions.first().waitFor({ state: 'attached' });

    await this.fromAccountSelect.selectOption({ index: 0 });
  }
}
