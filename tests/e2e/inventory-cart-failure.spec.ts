/**
 * Inventory and cart behavior under failure conditions.
 *
 * problem_user has deliberate bugs built into SauceDemo:
 *  - All product images are the same (wrong image for every item)
 *  - "Add to Cart" buttons are cross-mapped: clicking Backpack adds a different item
 *  - Sort Z-A does not produce reverse alphabetical order
 *
 * Tests marked with test.fail() document KNOWN BUGS:
 *  - They pass (green) when the bug is present
 *  - They fail (red) if the bug is unexpectedly fixed — alerting the team
 *
 * error_user has intermittent failures on sort and cart interactions.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { users } from '../../test-data/users';

async function loginAs(page, user: { username: string; password: string }) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(user.username, user.password);
  const inventory = new InventoryPage(page);
  await inventory.expectPageLoaded();
  return inventory;
}

// ─── problem_user — images ────────────────────────────────────────────────────

test.describe('problem_user — product images', { tag: ['@e2e', '@regression'] }, () => {
  test('all 6 product images are the same URL (known bug: wrong images)', async ({ page }) => {
    const inventory = await loginAs(page, users.problem);

    await test.step('Collect all image src values', async () => {
      const srcs = await page
        .locator('.inventory_item_img img')
        .evaluateAll((imgs) => imgs.map((img) => (img as HTMLImageElement).src));

      const unique = new Set(srcs);
      expect(srcs).toHaveLength(6);
      // Bug: all images point to the same URL
      expect(unique.size).toBe(1);
    });
  });

  test.fail('standard_user has 6 distinct images — confirms problem_user images are broken by comparison', async ({ page }) => {
    // This test uses standard_user and asserts all images are THE SAME.
    // It is marked test.fail() — standard_user has correct distinct images,
    // so this assertion fails, which is the EXPECTED result.
    // Purpose: proves the assertion logic is correct.
    const inventory = await loginAs(page, users.standard);

    const srcs = await page
      .locator('.inventory_item_img img')
      .evaluateAll((imgs) => imgs.map((img) => (img as HTMLImageElement).src));

    const unique = new Set(srcs);
    expect(unique.size).toBe(1); // This FAILS for standard_user (they have 6 distinct) — expected
  });
});

// ─── problem_user — sort ──────────────────────────────────────────────────────

test.describe('problem_user — sort is broken', { tag: ['@e2e', '@regression'] }, () => {
  test.fail('sort Z-A does not produce reverse alphabetical order (known bug)', async ({ page }) => {
    // test.fail(): assertion that items ARE sorted Z-A will fail for problem_user.
    // When this test shows as "passed (expected failure)", the bug is confirmed present.
    const inventory = await loginAs(page, users.problem);

    await test.step('Apply Z-A sort', async () => {
      await inventory.sortBy('za');
    });

    await test.step('Assert items in Z-A order (will fail — sort is broken)', async () => {
      const names = await inventory.getItemNames();
      const expected = [...names].sort((a, b) => b.localeCompare(a));
      expect(names).toEqual(expected); // fails because sort is broken
    });
  });

  test.fail('sort by price high-to-low does not produce correct order (known bug)', async ({ page }) => {
    const inventory = await loginAs(page, users.problem);

    await test.step('Apply price high-to-low sort', async () => {
      await inventory.sortBy('hilo');
    });

    await test.step('Assert descending price order (will fail — sort is broken)', async () => {
      const prices = await inventory.getItemPrices();
      for (let i = 0; i < prices.length - 1; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i + 1]);
      }
    });
  });
});

// ─── problem_user — Add to Cart cross-mapping ────────────────────────────────

test.describe('problem_user — Add to Cart cross-mapping (known bug)', { tag: ['@e2e', '@regression'] }, () => {
  test.fail('clicking Add to Cart for Sauce Labs Backpack does not add Backpack to cart', async ({ page }) => {
    // test.fail(): for problem_user, the Add to Cart button for Backpack
    // actually adds a different item. The assertion that Backpack IS in cart will fail.
    const inventory = await loginAs(page, users.problem);
    const cart = new CartPage(page);

    await test.step('Click Add to Cart for Sauce Labs Backpack', async () => {
      await inventory.addItemToCartByName('Sauce Labs Backpack');
      await inventory.expectCartCount(1);
    });

    await test.step('Cart contains Sauce Labs Backpack (fails — wrong item added)', async () => {
      await cart.goto();
      await cart.expectItemInCart('Sauce Labs Backpack'); // fails: different item is in cart
    });
  });

  test('problem_user Add to Cart does increment badge (button works, wrong item)', async ({ page }) => {
    // The button click itself works and badge increments — only the wrong item is added.
    const inventory = await loginAs(page, users.problem);

    await test.step('Add to Cart increments badge to 1', async () => {
      await inventory.addItemToCartByName('Sauce Labs Backpack');
      await inventory.expectCartCount(1);
    });
  });
});

// ─── error_user — cart and sort behavior ─────────────────────────────────────

test.describe('error_user — cart interactions', { tag: ['@e2e', '@regression'] }, () => {
  test('error_user can add items to cart and badge increments', async ({ page }) => {
    const inventory = await loginAs(page, users.error);

    await test.step('Add two items', async () => {
      await inventory.addItemToCartByName('Sauce Labs Backpack');
      await inventory.addItemToCartByName('Sauce Labs Bike Light');
    });

    await test.step('Badge shows 2', async () => {
      await inventory.expectCartCount(2);
    });
  });

  test.fail('error_user: removing an item from the cart page fails (known bug)', async ({ page }) => {
    // test.fail(): error_user's cart Remove button is broken — item stays in cart.
    const inventory = await loginAs(page, users.error);
    const cart = new CartPage(page);

    await test.step('Add item and go to cart', async () => {
      await inventory.addItemToCartByName('Sauce Labs Backpack');
      await cart.goto();
      await cart.expectItemCount(1);
    });

    await test.step('Remove item from cart (fails — removal does not work)', async () => {
      await cart.removeItem('Sauce Labs Backpack');
      await cart.expectItemCount(0); // fails: item remains in cart
    });
  });
});

test.describe('error_user — sort behavior', { tag: ['@e2e', '@regression'] }, () => {
  test.fail('error_user: sort Z-A does not produce correct order (known bug)', async ({ page }) => {
    const inventory = await loginAs(page, users.error);

    await test.step('Apply Z-A sort', async () => {
      await inventory.sortBy('za');
    });

    await test.step('Assert Z-A order (fails — sort is broken for error_user)', async () => {
      const names = await inventory.getItemNames();
      const expected = [...names].sort((a, b) => b.localeCompare(a));
      expect(names).toEqual(expected);
    });
  });
});
