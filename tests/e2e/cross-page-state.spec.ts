/**
 * Cross-page state consistency tests.
 *
 * Verifies that the cart state is coherent as the user moves between pages:
 *  - badge count always equals the number of items in the cart page
 *  - items added/removed on one page are immediately reflected on another
 *  - state survives navigation (inventory → detail → back, cart → continue shopping)
 *  - state survives a page reload
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { ProductDetailPage } from '../../pages/ProductDetailPage';
import { users } from '../../test-data/users';

async function loginAsStandard(page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(users.standard.username, users.standard.password);
}

const ITEM_A = 'Sauce Labs Backpack';
const ITEM_B = 'Sauce Labs Bike Light';
const ITEM_C = 'Sauce Labs Bolt T-Shirt';

// ─── Badge ↔ cart item count ──────────────────────────────────────────────────

test.describe('Badge vs cart item count', { tag: ['@e2e', '@regression'] }, () => {
  test('badge count equals item count in cart for a single item', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);

    await test.step('Login and add one item', async () => {
      await loginAsStandard(page);
      await inventory.addItemToCartByName(ITEM_A);
      await inventory.expectCartCount(1);
    });

    await test.step('Navigate to cart and assert one row', async () => {
      await inventory.goToCart();
      const count = await cart.getCartItemCount();
      expect(count).toBe(1);
    });
  });

  test('badge count equals item count in cart for three items', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);

    await test.step('Login and add three items', async () => {
      await loginAsStandard(page);
      for (const name of [ITEM_A, ITEM_B, ITEM_C]) {
        await inventory.addItemToCartByName(name);
      }
      await inventory.expectCartCount(3);
    });

    await test.step('Cart page shows three rows', async () => {
      await inventory.goToCart();
      const count = await cart.getCartItemCount();
      expect(count).toBe(3);
    });
  });

  test('badge and cart item count stay in sync after removing one item from inventory', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);

    await test.step('Add three items', async () => {
      await loginAsStandard(page);
      for (const name of [ITEM_A, ITEM_B, ITEM_C]) {
        await inventory.addItemToCartByName(name);
      }
    });

    await test.step('Remove one item on inventory page', async () => {
      await inventory.removeItemFromCartByName(ITEM_B);
      await inventory.expectCartCount(2);
    });

    await test.step('Cart page reflects 2 rows', async () => {
      await inventory.goToCart();
      const count = await cart.getCartItemCount();
      expect(count).toBe(2);
    });
  });
});

// ─── Inventory ↔ cart consistency ─────────────────────────────────────────────

test.describe('Inventory ↔ cart consistency', { tag: ['@e2e', '@regression'] }, () => {
  test('item added on inventory page appears in cart by name', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);

    await test.step('Add item on inventory', async () => {
      await loginAsStandard(page);
      await inventory.addItemToCartByName(ITEM_A);
    });

    await test.step('Cart contains the item by name', async () => {
      await cart.goto();
      await cart.expectItemInCart(ITEM_A);
    });
  });

  test('removing item from cart reverts inventory button to Add to Cart', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);

    await test.step('Add item, verify button is Remove', async () => {
      await loginAsStandard(page);
      await inventory.addItemToCartByName(ITEM_A);
      await inventory.expectRemoveButtonVisible(ITEM_A);
    });

    await test.step('Remove from cart page', async () => {
      await cart.goto();
      await cart.removeItem(ITEM_A);
      await cart.continueShopping();
    });

    await test.step('Inventory button reverted to Add to Cart', async () => {
      await inventory.expectAddToCartButtonVisible(ITEM_A);
    });
  });

  test('cart items list matches names added on inventory page', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const addedItems = [ITEM_A, ITEM_B];

    await test.step('Add two items', async () => {
      await loginAsStandard(page);
      for (const name of addedItems) {
        await inventory.addItemToCartByName(name);
      }
    });

    await test.step('Cart names match', async () => {
      await cart.goto();
      const cartNames = await cart.getItemNames();
      for (const name of addedItems) {
        expect(cartNames).toContain(name);
      }
      expect(cartNames).toHaveLength(addedItems.length);
    });
  });
});

// ─── Detail page ↔ cart consistency ──────────────────────────────────────────

test.describe('Detail page ↔ cart consistency', { tag: ['@e2e', '@regression'] }, () => {
  test('item added on detail page appears in cart', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const detail = new ProductDetailPage(page);
    const cart = new CartPage(page);

    await test.step('Open detail page and add to cart', async () => {
      await loginAsStandard(page);
      await inventory.openProductDetailByName(ITEM_A);
      await detail.addToCart();
    });

    await test.step('Cart contains the item', async () => {
      await cart.goto();
      await cart.expectItemInCart(ITEM_A);
      const count = await cart.getCartItemCount();
      expect(count).toBe(1);
    });
  });

  test('removing on detail page clears the item from cart', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const detail = new ProductDetailPage(page);
    const cart = new CartPage(page);

    await test.step('Add then remove on detail page', async () => {
      await loginAsStandard(page);
      await inventory.openProductDetailByName(ITEM_A);
      await detail.addToCart();
      await detail.removeFromCart();
    });

    await test.step('Cart is empty', async () => {
      await cart.goto();
      await cart.expectItemCount(0);
    });
  });
});

// ─── State persistence across navigation ─────────────────────────────────────

test.describe('Cart state persists across navigation', { tag: ['@e2e', '@regression'] }, () => {
  test('badge survives navigating to detail page and back', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const detail = new ProductDetailPage(page);

    await test.step('Add an item on inventory', async () => {
      await loginAsStandard(page);
      await inventory.addItemToCartByName(ITEM_A);
      await inventory.expectCartCount(1);
    });

    await test.step('Navigate to detail of a different item and back', async () => {
      await inventory.openProductDetailByName(ITEM_B);
      await detail.goBackToInventory();
    });

    await test.step('Badge is still 1', async () => {
      await inventory.expectCartCount(1);
    });
  });

  test('badge survives entering cart and clicking Continue Shopping', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);

    await test.step('Add two items', async () => {
      await loginAsStandard(page);
      await inventory.addItemToCartByName(ITEM_A);
      await inventory.addItemToCartByName(ITEM_B);
      await inventory.expectCartCount(2);
    });

    await test.step('Go to cart, then continue shopping', async () => {
      await inventory.goToCart();
      await cart.continueShopping();
    });

    await test.step('Badge still shows 2', async () => {
      await inventory.expectCartCount(2);
    });
  });

  test('cart contents survive a page reload', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);

    await test.step('Add two items', async () => {
      await loginAsStandard(page);
      await inventory.addItemToCartByName(ITEM_A);
      await inventory.addItemToCartByName(ITEM_B);
    });

    await test.step('Reload inventory page', async () => {
      await page.reload();
      await inventory.expectPageLoaded();
    });

    await test.step('Badge and cart still show 2 items', async () => {
      await inventory.expectCartCount(2);
      await cart.goto();
      const count = await cart.getCartItemCount();
      expect(count).toBe(2);
    });
  });
});

// ─── Remove on cart page syncs badge on inventory ─────────────────────────────

test.describe('Remove on cart page syncs badge to inventory', { tag: ['@e2e', '@regression'] }, () => {
  test('removing sole item on cart page clears badge on inventory', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);

    await test.step('Add one item', async () => {
      await loginAsStandard(page);
      await inventory.addItemToCartByName(ITEM_A);
      await inventory.expectCartCount(1);
    });

    await test.step('Remove from cart page', async () => {
      await cart.goto();
      await cart.removeItem(ITEM_A);
      await cart.expectItemCount(0);
    });

    await test.step('Badge is gone on inventory', async () => {
      await inventory.expectPageLoaded();
      await inventory.expectCartCount(0);
    });
  });

  test('removing one of two items on cart page decrements badge on inventory', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);

    await test.step('Add two items', async () => {
      await loginAsStandard(page);
      await inventory.addItemToCartByName(ITEM_A);
      await inventory.addItemToCartByName(ITEM_B);
      await inventory.expectCartCount(2);
    });

    await test.step('Remove one from cart page', async () => {
      await cart.goto();
      await cart.removeItem(ITEM_A);
    });

    await test.step('Badge is 1 on inventory', async () => {
      await inventory.expectPageLoaded();
      await inventory.expectCartCount(1);
    });
  });
});

// ─── Add from multiple places ─────────────────────────────────────────────────

test.describe('Add from inventory and detail page — cart reflects both', { tag: ['@e2e', '@regression'] }, () => {
  test('add one item on inventory and one on detail page — cart has exactly two', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const detail = new ProductDetailPage(page);
    const cart = new CartPage(page);

    await test.step('Add ITEM_A on inventory', async () => {
      await loginAsStandard(page);
      await inventory.addItemToCartByName(ITEM_A);
    });

    await test.step('Open detail page for ITEM_B and add it', async () => {
      await inventory.openProductDetailByName(ITEM_B);
      await detail.addToCart();
      await detail.expectCartCount(2);
    });

    await test.step('Cart has exactly 2 rows with both items', async () => {
      await cart.goto();
      await cart.expectItemCount(2);
      await cart.expectItemInCart(ITEM_A);
      await cart.expectItemInCart(ITEM_B);
    });
  });
});

// ─── After Reset App State ────────────────────────────────────────────────────

test.describe('After Reset App State — badge and cart empty everywhere', { tag: ['@e2e', '@regression'] }, () => {
  test('badge is 0 on inventory, cart is empty, detail badge is 0 after reset', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const detail = new ProductDetailPage(page);

    await test.step('Add two items', async () => {
      await loginAsStandard(page);
      await inventory.addItemToCartByName(ITEM_A);
      await inventory.addItemToCartByName(ITEM_B);
      await inventory.expectCartCount(2);
    });

    await test.step('Reset App State', async () => {
      await inventory.resetAppState();
    });

    await test.step('Badge gone on inventory', async () => {
      await inventory.expectCartCount(0);
    });

    await test.step('Cart page is empty', async () => {
      await cart.goto();
      await cart.expectItemCount(0);
    });

    await test.step('Detail page shows badge = 0', async () => {
      await inventory.expectPageLoaded();
      await inventory.openProductDetailByName(ITEM_A);
      await detail.expectCartCount(0);
    });
  });
});

// ─── After successful checkout ────────────────────────────────────────────────

test.describe('After successful checkout — badge cleared and detail page resets', { tag: ['@e2e', '@regression'] }, () => {
  test('detail page shows Add to Cart button after order is completed', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);
    const detail = new ProductDetailPage(page);

    await test.step('Complete a checkout with ITEM_A', async () => {
      await loginAsStandard(page);
      await inventory.addItemToCartByName(ITEM_A);
      await cart.goto();
      await cart.proceedToCheckout();
      await checkout.fillShippingInfo('Jane', 'Doe', '10001');
      await checkout.finish();
    });

    await test.step('Go back to inventory and open detail page', async () => {
      await checkout.clickBackHome();
      await inventory.openProductDetailByName(ITEM_A);
    });

    await test.step('Add to Cart button is visible — cart was cleared by checkout', async () => {
      await expect(detail.addToCartButton).toBeVisible();
    });
  });
});
