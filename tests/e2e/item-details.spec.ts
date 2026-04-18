/**
 * Product detail page tests.
 *
 * Verifies that:
 *  - detail page opens from inventory and shows correct content
 *  - name, price, and description on the detail page match the inventory listing
 *  - Add to Cart / Remove work on the detail page
 *  - cart badge updates correctly from the detail page
 *  - Back to Products returns to the inventory page (not the detail page)
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { ProductDetailPage } from '../../pages/ProductDetailPage';
import { users } from '../../test-data/users';

const ITEM = 'Sauce Labs Backpack';

async function loginAndGoToDetail(page, itemName = ITEM) {
  const loginPage = new LoginPage(page);
  const inventory = new InventoryPage(page);

  await loginPage.goto();
  await loginPage.login(users.standard.username, users.standard.password);
  await inventory.openProductDetailByName(itemName);

  return { inventory, detail: new ProductDetailPage(page) };
}

test.describe('Product detail page', { tag: ['@e2e', '@regression'] }, () => {
  test('clicking item name in inventory opens detail page', async ({ page }) => {
    const { detail } = await loginAndGoToDetail(page);

    await test.step('Assert detail page loaded', async () => {
      await detail.expectLoaded();
    });
  });

  test('detail page name matches inventory listing', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);

    let inventoryName: string;

    await test.step('Capture name from inventory', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      inventoryName = (await inventory.getItemNames()).find((n) => n.includes('Backpack')) ?? ITEM;
    });

    await test.step('Open detail page', async () => {
      await inventory.openProductDetailByName(ITEM);
    });

    const detail = new ProductDetailPage(page);
    await test.step('Name on detail matches inventory', async () => {
      const detailName = await detail.getName();
      expect(detailName).toBe(inventoryName);
    });
  });

  test('detail page price matches inventory listing', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);
    let inventoryPrice: number;

    await test.step('Capture price from inventory', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      inventoryPrice = await inventory.getItemPriceByName(ITEM);
    });

    await test.step('Open detail page', async () => {
      await inventory.openProductDetailByName(ITEM);
    });

    const detail = new ProductDetailPage(page);
    await test.step('Price on detail matches inventory', async () => {
      const detailPrice = await detail.getPrice();
      expect(detailPrice).toBe(inventoryPrice);
    });
  });

  test('detail page shows non-empty description', async ({ page }) => {
    const { detail } = await loginAndGoToDetail(page);

    await test.step('Description is non-empty', async () => {
      const desc = await detail.getDescription();
      expect(desc.trim()).not.toBe('');
    });
  });

  test('Add to Cart on detail page increments cart badge', async ({ page }) => {
    const { detail } = await loginAndGoToDetail(page);

    await test.step('Badge is absent before adding', async () => {
      await detail.expectCartCount(0);
    });

    await test.step('Click Add to Cart', async () => {
      await detail.addToCart();
    });

    await test.step('Badge shows 1', async () => {
      await detail.expectCartCount(1);
    });
  });

  test('Remove on detail page decrements cart badge', async ({ page }) => {
    const { detail } = await loginAndGoToDetail(page);

    await test.step('Add to cart then remove', async () => {
      await detail.addToCart();
      await detail.expectCartCount(1);
      await detail.removeFromCart();
    });

    await test.step('Badge disappears after remove', async () => {
      await detail.expectCartCount(0);
    });
  });

  test('cart badge added on detail page is visible when returning to inventory', async ({ page }) => {
    const { detail } = await loginAndGoToDetail(page);
    const inventory = new InventoryPage(page);

    await test.step('Add to cart on detail page', async () => {
      await detail.addToCart();
      await detail.expectCartCount(1);
    });

    await test.step('Go back to inventory', async () => {
      await detail.goBackToInventory();
    });

    await test.step('Badge is still 1 on inventory page', async () => {
      await inventory.expectCartCount(1);
    });
  });

  test('Back to Products returns to inventory, not a detail page', async ({ page }) => {
    const { detail } = await loginAndGoToDetail(page);

    await test.step('Navigate back', async () => {
      await detail.goBackToInventory();
    });

    await test.step('URL is inventory page (not inventory-item)', async () => {
      await expect(page).toHaveURL(/inventory(?!-item)/);
    });
  });
});
