import { Page, Locator, expect } from '@playwright/test';

export class ProductDetailPage {
  readonly page: Page;
  readonly productName: Locator;
  readonly productDescription: Locator;
  readonly productPrice: Locator;
  readonly productImage: Locator;
  readonly addToCartButton: Locator;
  readonly removeButton: Locator;
  readonly backButton: Locator;
  readonly cartBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productName = page.locator('[data-test="inventory-item-name"]');
    this.productDescription = page.locator('[data-test="inventory-item-desc"]');
    this.productPrice = page.locator('[data-test="inventory-item-price"]');
    this.productImage = page.locator('.inventory_details_img');
    this.addToCartButton = page.getByRole('button', { name: /add to cart/i });
    this.removeButton = page.getByRole('button', { name: /remove/i });
    this.backButton = page.locator('[data-test="back-to-products"]');
    this.cartBadge = page.locator('.shopping_cart_badge');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/inventory-item/);
    await expect(this.productName).toBeVisible();
    await expect(this.productPrice).toBeVisible();
  }

  async getName(): Promise<string> {
    return (await this.productName.textContent()) ?? '';
  }

  async getPrice(): Promise<number> {
    const text = (await this.productPrice.textContent()) ?? '';
    return parseFloat(text.replace('$', ''));
  }

  async getDescription(): Promise<string> {
    return (await this.productDescription.textContent()) ?? '';
  }

  async addToCart() {
    await this.addToCartButton.click();
  }

  async removeFromCart() {
    await this.removeButton.click();
  }

  async goBackToInventory() {
    await this.backButton.click();
    await expect(this.page).toHaveURL(/inventory(?!-item)/);
  }

  async expectCartCount(count: number) {
    if (count === 0) {
      await expect(this.cartBadge).not.toBeVisible();
    } else {
      await expect(this.cartBadge).toHaveText(String(count));
    }
  }
}
