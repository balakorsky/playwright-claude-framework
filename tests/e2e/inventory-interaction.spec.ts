/**
 * Inventory interaction integrity tests.
 *
 * Verifies that:
 *  - changing sort order does not reset cart badge or contents
 *  - product detail pages open correctly after sort is applied
 *  - sort order is NOT preserved after navigating to a detail page and back
 *    (SauceDemo resets sort to default on return — documented behavior)
 *  - Reset App State reverts all "Remove" buttons back to "Add to Cart"
 *  - Reset App State resets the sort dropdown to A-Z default
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { ProductDetailPage } from '../../pages/ProductDetailPage';
import { CartPage } from '../../pages/CartPage';
import { users } from '../../test-data/users';

const ITEM_A = 'Sauce Labs Backpack';
const ITEM_B = 'Sauce Labs Fleece Jacket';

async function loginAsStandard(page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(users.standard.username, users.standard.password);
}

// ─── Sort does not reset cart ─────────────────────────────────────────────────

test.describe('Sort does not reset cart', { tag: ['@e2e', '@regression'] }, () => {
  test('badge is unchanged after sorting Z-A', async ({ page }) => {
    const inventory = new InventoryPage(page);

    await test.step('Add two items', async () => {
      await loginAsStandard(page);
      await inventory.addItemToCartByName(ITEM_A);
      await inventory.addItemToCartByName(ITEM_B);
      await inventory.expectCartCount(2);
    });

    await test.step('Sort Z-A', async () => {
      await inventory.sortBy('za');
    });

    await test.step('Badge is still 2', async () => {
      await inventory.expectCartCount(2);
    });
  });

  test('badge is unchanged after sorting by price low-to-high', async ({ page }) => {
    const inventory = new InventoryPage(page);

    await test.step('Add one item', async () => {
      await loginAsStandard(page);
      await inventory.addItemToCartByName(ITEM_A);
      await inventory.expectCartCount(1);
    });

    await test.step('Sort by price low-to-high', async () => {
      await inventory.sortBy('lohi');
    });

    await test.step('Badge is still 1', async () => {
      await inventory.expectCartCount(1);
    });
  });

  test('badge is unchanged after sorting by price high-to-low', async ({ page }) => {
    const inventory = new InventoryPage(page);

    await test.step('Add item, sort high-to-low, badge stable', async () => {
      await loginAsStandard(page);
      await inventory.addItemToCartByName(ITEM_B);
      await inventory.expectCartCount(1);
      await inventory.sortBy('hilo');
      await inventory.expectCartCount(1);
    });
  });

  test('Remove button stays on item after sorting', async ({ page }) => {
    const inventory = new InventoryPage(page);

    await test.step('Add item', async () => {
      await loginAsStandard(page);
      await inventory.addItemToCartByName(ITEM_A);
      await inventory.expectRemoveButtonVisible(ITEM_A);
    });

    await test.step('Sort Z-A', async () => {
      await inventory.sortBy('za');
    });

    await test.step('Remove button still visible for the added item', async () => {
      await inventory.expectRemoveButtonVisible(ITEM_A);
    });
  });
});

// ─── Detail page opens correctly after sort ───────────────────────────────────

test.describe('Detail page opens correctly after sort', { tag: ['@e2e', '@regression'] }, () => {
  test('item name and price on detail page are correct after sorting Z-A', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const detail = new ProductDetailPage(page);

    let priceBeforeSort: number;

    await test.step('Get price before sort', async () => {
      await loginAsStandard(page);
      priceBeforeSort = await inventory.getItemPriceByName(ITEM_A);
    });

    await test.step('Sort Z-A and open detail page', async () => {
      await inventory.sortBy('za');
      await inventory.openProductDetailByName(ITEM_A);
    });

    await test.step('Detail name and price are correct', async () => {
      const detailName = await detail.getName();
      const detailPrice = await detail.getPrice();
      expect(detailName).toBe(ITEM_A);
      expect(detailPrice).toBe(priceBeforeSort);
    });
  });

  test('item added from detail page after sort appears in cart', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const detail = new ProductDetailPage(page);
    const cart = new CartPage(page);

    await test.step('Sort high-to-low and open detail', async () => {
      await loginAsStandard(page);
      await inventory.sortBy('hilo');
      await inventory.openProductDetailByName(ITEM_B);
    });

    await test.step('Add to cart from detail page', async () => {
      await detail.addToCart();
      await detail.expectCartCount(1);
    });

    await test.step('Cart contains the item', async () => {
      await cart.goto();
      await cart.expectItemInCart(ITEM_B);
    });
  });
});

// ─── Sort persistence after navigation ───────────────────────────────────────

test.describe('Sort order after returning from detail page', { tag: ['@e2e', '@regression'] }, () => {
  test('SauceDemo resets sort to A-Z default after navigating to detail and back', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const detail = new ProductDetailPage(page);

    await test.step('Sort Z-A', async () => {
      await loginAsStandard(page);
      await inventory.sortBy('za');
      const dropdownValue = await inventory.sortDropdown.inputValue();
      expect(dropdownValue).toBe('za');
    });

    await test.step('Navigate to detail and back', async () => {
      await inventory.openProductDetailByName(ITEM_A);
      await detail.goBackToInventory();
    });

    await test.step('Sort resets to A-Z (SauceDemo does not persist sort)', async () => {
      const dropdownValue = await inventory.sortDropdown.inputValue();
      expect(dropdownValue).toBe('az');
    });
  });
});

// ─── Reset App State restores inventory UI ───────────────────────────────────

test.describe('Reset App State restores inventory UI state', { tag: ['@e2e', '@regression'] }, () => {
  test('all Remove buttons revert to Add to Cart after reset', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const items = [ITEM_A, ITEM_B, 'Sauce Labs Bolt T-Shirt'];

    await test.step('Add 3 items — buttons show Remove', async () => {
      await loginAsStandard(page);
      for (const name of items) {
        await inventory.addItemToCartByName(name);
        await inventory.expectRemoveButtonVisible(name);
      }
    });

    await test.step('Reset App State', async () => {
      await inventory.resetAppState();
    });

    await test.step('All buttons revert to Add to Cart', async () => {
      for (const name of items) {
        await inventory.expectAddToCartButtonVisible(name);
      }
    });
  });

  test('sort dropdown resets to A-Z after Reset App State', async ({ page }) => {
    const inventory = new InventoryPage(page);

    await test.step('Sort Z-A', async () => {
      await loginAsStandard(page);
      await inventory.sortBy('za');
    });

    await test.step('Reset App State', async () => {
      await inventory.resetAppState();
    });

    await test.step('Sort dropdown is back to A-Z', async () => {
      const value = await inventory.sortDropdown.inputValue();
      expect(value).toBe('az');
    });
  });
});
