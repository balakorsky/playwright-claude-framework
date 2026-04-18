/**
 * Bulk cart operations tests.
 *
 * Verifies cart integrity when adding/removing items at scale:
 *  - all 6 products can be added; badge and cart row count match
 *  - all 6 products can be removed from the cart; cart is empty
 *  - badge always equals the number of rows on the cart page
 *  - cart contents are not affected by sort order changes
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { users } from '../../test-data/users';

async function loginAsStandard(page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(users.standard.username, users.standard.password);
}

// ─── Add / remove all items ───────────────────────────────────────────────────

test.describe('Bulk cart – add and remove all items', { tag: ['@e2e', '@regression'] }, () => {
  test('add all 6 items — badge equals 6 and cart shows 6 rows', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);

    let allNames: string[];

    await test.step('Login and collect all product names', async () => {
      await loginAsStandard(page);
      allNames = await inventory.getItemNames();
      expect(allNames).toHaveLength(6);
    });

    await test.step('Add every item', async () => {
      for (const name of allNames) {
        await inventory.addItemToCartByName(name);
      }
    });

    await test.step('Badge shows 6', async () => {
      await inventory.expectCartCount(6);
    });

    await test.step('Cart page shows 6 rows', async () => {
      await inventory.goToCart();
      await cart.expectItemCount(6);
    });
  });

  test('add all 6 items then remove all from inventory — badge gone and cart empty', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    let allNames: string[];

    await test.step('Add all items', async () => {
      await loginAsStandard(page);
      allNames = await inventory.getItemNames();
      for (const name of allNames) {
        await inventory.addItemToCartByName(name);
      }
      await inventory.expectCartCount(6);
    });

    await test.step('Remove all items from inventory page', async () => {
      for (const name of allNames) {
        await inventory.removeItemFromCartByName(name);
      }
    });

    await test.step('Badge is gone', async () => {
      await inventory.expectCartCount(0);
    });

    await test.step('Cart page is empty', async () => {
      await cart.goto();
      await cart.expectItemCount(0);
    });
  });

  test('add all 6 items then remove all from cart page — cart empty and badge gone', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    let allNames: string[];

    await test.step('Add all items', async () => {
      await loginAsStandard(page);
      allNames = await inventory.getItemNames();
      for (const name of allNames) {
        await inventory.addItemToCartByName(name);
      }
    });

    await test.step('Remove all from cart page', async () => {
      await cart.goto();
      for (const name of allNames) {
        await cart.removeItem(name);
      }
    });

    await test.step('Cart is empty', async () => {
      await cart.expectItemCount(0);
    });

    await test.step('Badge is gone on inventory', async () => {
      await inventory.expectPageLoaded();
      await inventory.expectCartCount(0);
    });
  });
});

// ─── Partial add / remove ─────────────────────────────────────────────────────

test.describe('Bulk cart – partial add and remove', { tag: ['@e2e', '@regression'] }, () => {
  test('add 4 items, remove 2, badge and cart show 2', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    let allNames: string[];

    await test.step('Add 4 items', async () => {
      await loginAsStandard(page);
      allNames = await inventory.getItemNames();
      for (const name of allNames.slice(0, 4)) {
        await inventory.addItemToCartByName(name);
      }
      await inventory.expectCartCount(4);
    });

    await test.step('Remove 2 from inventory', async () => {
      await inventory.removeItemFromCartByName(allNames[0]);
      await inventory.removeItemFromCartByName(allNames[1]);
      await inventory.expectCartCount(2);
    });

    await test.step('Cart shows exactly 2 rows', async () => {
      await cart.goto();
      await cart.expectItemCount(2);
    });
  });

  test('badge count always equals cart row count across multiple add/remove cycles', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    let allNames: string[];

    await test.step('Login', async () => {
      await loginAsStandard(page);
      allNames = await inventory.getItemNames();
    });

    for (let i = 1; i <= 3; i++) {
      await test.step(`Add item ${i} and verify sync`, async () => {
        await inventory.addItemToCartByName(allNames[i - 1]);
        await inventory.expectCartCount(i);
        await cart.goto();
        await cart.expectItemCount(i);
        await inventory.expectPageLoaded();
      });
    }

    for (let i = 2; i >= 0; i--) {
      await test.step(`Remove item ${3 - i} from inventory and verify sync`, async () => {
        await inventory.removeItemFromCartByName(allNames[2 - i]);
        await inventory.expectCartCount(i);
        await cart.goto();
        await cart.expectItemCount(i);
        if (i > 0) await inventory.expectPageLoaded();
      });
    }
  });
});

// ─── Sort does not affect cart contents ───────────────────────────────────────

test.describe('Cart contents are independent of sort order', { tag: ['@e2e', '@regression'] }, () => {
  test('cart items are unchanged after sorting inventory A-Z then Z-A', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const itemsToAdd = ['Sauce Labs Backpack', 'Sauce Labs Bike Light', 'Sauce Labs Bolt T-Shirt'];

    await test.step('Add 3 items', async () => {
      await loginAsStandard(page);
      for (const name of itemsToAdd) {
        await inventory.addItemToCartByName(name);
      }
    });

    await test.step('Sort Z-A then back to A-Z', async () => {
      await inventory.sortBy('za');
      await inventory.sortBy('az');
    });

    await test.step('Cart still has same 3 items', async () => {
      await cart.goto();
      await cart.expectItemCount(3);
      for (const name of itemsToAdd) {
        await cart.expectItemInCart(name);
      }
    });
  });

  test('cart items are unchanged after sorting by price', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const itemsToAdd = ['Sauce Labs Backpack', 'Sauce Labs Fleece Jacket'];

    await test.step('Add 2 items', async () => {
      await loginAsStandard(page);
      for (const name of itemsToAdd) {
        await inventory.addItemToCartByName(name);
      }
    });

    await test.step('Sort by price high-to-low', async () => {
      await inventory.sortBy('hilo');
    });

    await test.step('Cart still has both items', async () => {
      await cart.goto();
      await cart.expectItemCount(2);
      for (const name of itemsToAdd) {
        await cart.expectItemInCart(name);
      }
    });
  });
});
