import { Page, Locator, expect } from '@playwright/test';

// Page Object for the SauceDemo login page
// Encapsulates all selectors and actions related to login
export class LoginPage {
  readonly page: Page;

  // Locators
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly errorDismissButton: Locator;
  readonly inventoryList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('#user-name');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('#login-button');
    this.errorMessage = page.locator('[data-test="error"]');
    this.errorDismissButton = page.locator('[data-test="error"] button');
    this.inventoryList = page.locator('.inventory_list');
  }

  // Navigate to the login page
  async goto() {
    await this.page.goto('https://www.saucedemo.com/');
  }

  // Fill in credentials and submit the login form
  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  // Assert that login was successful (redirected to inventory with list visible)
  async expectLoginSuccess(timeout?: number) {
    await expect(this.page).toHaveURL(/inventory/, { timeout });
    await expect(this.inventoryList).toBeVisible({ timeout });
  }

  // Assert that an error message is visible and contains the expected text
  async expectErrorMessage(text: string) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(text);
  }

  // Assert that an error message is visible (without checking text)
  async expectErrorVisible() {
    await expect(this.errorMessage).toBeVisible();
  }

  // Assert that the user is NOT redirected to inventory
  async expectLoginFailed() {
    await expect(this.page).not.toHaveURL(/inventory/);
  }

  // Dismiss the error message by clicking the X button
  async dismissError() {
    await this.errorDismissButton.click();
  }

  // Assert that the error message is no longer visible
  async expectErrorDismissed() {
    await expect(this.errorMessage).not.toBeVisible();
  }
}
