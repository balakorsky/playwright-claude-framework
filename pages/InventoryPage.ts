import { Page, Locator, expect } from '@playwright/test';

export class InventoryPage {
  readonly page: Page;
  readonly inventoryList: Locator;
  readonly inventoryItems: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;
  readonly sortDropdown: Locator;
  readonly burgerMenuButton: Locator;
  readonly logoutLink: Locator;
  readonly resetAppStateLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.inventoryList = page.locator('.inventory_list');
    this.inventoryItems = page.locator('.inventory_item');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.cartLink = page.locator('.shopping_cart_link');
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.burgerMenuButton = page.locator('#react-burger-menu-btn');
    this.logoutLink = page.locator('#logout_sidebar_link');
    this.resetAppStateLink = page.locator('#reset_sidebar_link');
  }

  async expectPageLoaded() {
    await expect(this.page).toHaveURL(/inventory/);
    await expect(this.inventoryList).toBeVisible();
  }

  async expectItemsCountGreaterThan(count: number) {
    const items = await this.inventoryItems.count();
    expect(items).toBeGreaterThan(count);
  }

  async addItemToCartByName(name: string) {
    const item = this.inventoryItems.filter({ hasText: name });
    await item.getByRole('button', { name: /add to cart/i }).click();
  }

  async removeItemFromCartByName(name: string) {
    const item = this.inventoryItems.filter({ hasText: name });
    await item.getByRole('button', { name: /remove/i }).click();
  }

  async expectCartCount(count: number) {
    if (count === 0) {
      await expect(this.cartBadge).not.toBeVisible();
    } else {
      await expect(this.cartBadge).toHaveText(String(count));
    }
  }

  async getItemPrices(): Promise<number[]> {
    const priceLocators = this.page.locator('.inventory_item_price');
    const texts = await priceLocators.allTextContents();
    return texts.map((t) => parseFloat(t.replace('$', '')));
  }

  async sortBy(option: 'az' | 'za' | 'lohi' | 'hilo') {
    await this.sortDropdown.selectOption(option);
  }

  async goToCart() {
    await this.cartLink.click();
    await expect(this.page).toHaveURL(/cart/);
  }

  async getItemCount(): Promise<number> {
    return this.inventoryItems.count();
  }

  async getItemNames(): Promise<string[]> {
    return this.page.locator('.inventory_item_name').allTextContents();
  }

  async getItemPriceByName(name: string): Promise<number> {
    const item = this.inventoryItems.filter({ hasText: name });
    const text = await item.locator('.inventory_item_price').textContent();
    return parseFloat((text ?? '').replace('$', ''));
  }

  async getItemImageSrcByName(name: string): Promise<string> {
    const item = this.inventoryItems.filter({ hasText: name });
    return (await item.locator('img').getAttribute('src')) ?? '';
  }

  async logout() {
    await this.burgerMenuButton.click();
    await this.logoutLink.waitFor({ state: 'visible' });
    await this.logoutLink.click();
    await expect(this.page).toHaveURL('https://www.saucedemo.com/');
  }

  async resetAppState() {
    await this.burgerMenuButton.click();
    await this.resetAppStateLink.waitFor({ state: 'visible' });
    await this.resetAppStateLink.click();
    await this.burgerMenuButton.click();
  }
}