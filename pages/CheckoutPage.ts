import { Page, Locator, expect } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;
  // Step 1 – shipping info
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  // Step 2 – order summary
  readonly summaryItems: Locator;
  readonly itemTotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;
  readonly finishButton: Locator;
  // Confirmation
  readonly confirmationHeader: Locator;
  readonly completionText: Locator;
  readonly backHomeButton: Locator;
  // Validation
  readonly errorMessage: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.summaryItems = page.locator('.cart_item');
    this.itemTotal = page.locator('.summary_subtotal_label');
    this.tax = page.locator('.summary_tax_label');
    this.total = page.locator('.summary_total_label');
    this.finishButton = page.locator('[data-test="finish"]');
    this.confirmationHeader = page.locator('[data-test="complete-header"]');
    this.completionText = page.locator('[data-test="complete-text"]');
    this.backHomeButton = page.locator('[data-test="back-to-products"]');
    this.errorMessage = page.locator('[data-test="error"]');
    this.cancelButton = page.locator('[data-test="cancel"]');
  }

  async submitShippingInfo(firstName: string, lastName: string, postalCode: string) {
    if (firstName) await this.firstNameInput.fill(firstName);
    if (lastName)  await this.lastNameInput.fill(lastName);
    if (postalCode) await this.postalCodeInput.fill(postalCode);
    await this.continueButton.click();
  }

  async expectError(text: string) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(text);
  }

  async expectStaysOnStepOne() {
    await expect(this.page).toHaveURL(/checkout-step-one/);
  }

  async cancel() {
    await this.cancelButton.click();
    await expect(this.page).toHaveURL(/cart/);
  }

  async fillShippingInfo(firstName: string, lastName: string, postalCode: string) {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.postalCodeInput.fill(postalCode);
    await this.continueButton.click();
    await expect(this.page).toHaveURL(/checkout-step-two/);
  }

  async expectSummaryItemCount(count: number) {
    await expect(this.summaryItems).toHaveCount(count);
  }

  async getTotalText(): Promise<string> {
    return (await this.total.textContent()) ?? '';
  }

  async finish() {
    await this.finishButton.click();
    await expect(this.page).toHaveURL(/checkout-complete/);
  }

  async expectOnStepOne() {
    await expect(this.page).toHaveURL(/checkout-step-one/);
    await expect(this.continueButton).toBeVisible();
  }

  async expectOnStepTwo() {
    await expect(this.page).toHaveURL(/checkout-step-two/);
    await expect(this.finishButton).toBeVisible();
  }

  async expectOnComplete() {
    await expect(this.page).toHaveURL(/checkout-complete/);
    await expect(this.confirmationHeader).toBeVisible();
  }

  async expectSummaryVisible() {
    await expect(this.summaryItems.first()).toBeVisible();
  }

  async expectSummaryEmpty() {
    await expect(this.summaryItems).toHaveCount(0);
  }

  async expectFinishButtonVisible() {
    await expect(this.finishButton).toBeVisible();
  }

  async expectErrorNotVisible() {
    await expect(this.errorMessage).not.toBeVisible();
  }

  async expectRedirectedToLogin() {
    await expect(this.page).toHaveURL('https://www.saucedemo.com/');
    await expect(this.page.locator('#login-button')).toBeVisible();
  }

  async clickBackHome() {
    await this.backHomeButton.click();
    await expect(this.page).toHaveURL(/inventory/);
  }

  async getFieldValues(): Promise<{ firstName: string; lastName: string; postalCode: string }> {
    return {
      firstName: await this.firstNameInput.inputValue(),
      lastName: await this.lastNameInput.inputValue(),
      postalCode: await this.postalCodeInput.inputValue(),
    };
  }

  async expectOrderConfirmed() {
    await expect(this.confirmationHeader).toHaveText('Thank you for your order!');
  }

  private async parseAmount(locator: Locator): Promise<number> {
    const text = (await locator.textContent()) ?? '';
    return parseFloat(text.replace(/[^0-9.]/g, ''));
  }

  async getSubtotalAmount(): Promise<number> {
    return this.parseAmount(this.itemTotal);
  }

  async getTaxAmount(): Promise<number> {
    return this.parseAmount(this.tax);
  }

  async getTotalAmount(): Promise<number> {
    return this.parseAmount(this.total);
  }
}
