import { Page, Locator, expect } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly cartItems: Locator;
  readonly cartLink: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartItems = page.locator('.cart_item');
    this.cartLink = page.locator('.shopping_cart_link');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
  }

  async goto() {
    if (await this.cartLink.isVisible()) {
      await this.cartLink.click();
    } else {
      await this.page.goto('https://www.saucedemo.com/cart.html');
    }
    await expect(this.page).toHaveURL(/cart/);
  }

  async expectItemCount(count: number) {
    await expect(this.cartItems).toHaveCount(count);
  }

  async expectItemInCart(name: string) {
    await expect(this.page.locator('.cart_item_label').filter({ hasText: name })).toBeVisible();
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
    await expect(this.page).toHaveURL(/checkout-step-one/);
  }

  async getItemPrices(): Promise<number[]> {
    const texts = await this.page.locator('.cart_item .inventory_item_price').allTextContents();
    return texts.map((t) => parseFloat(t.replace('$', '')));
  }

  async getItemPriceByName(name: string): Promise<number> {
    const item = this.cartItems.filter({ hasText: name });
    const text = await item.locator('.inventory_item_price').textContent();
    return parseFloat((text ?? '').replace('$', ''));
  }

  async getItemNames(): Promise<string[]> {
    return this.page.locator('.cart_item .inventory_item_name').allTextContents();
  }

  async removeItem(name: string) {
    const item = this.cartItems.filter({ hasText: name });
    await item.getByRole('button', { name: /remove/i }).click();
  }

  async continueShopping() {
    await this.continueShoppingButton.click();
    await expect(this.page).toHaveURL(/inventory(?!-item)/);
  }

  async getCartItemCount(): Promise<number> {
    return this.cartItems.count();
  }
}
