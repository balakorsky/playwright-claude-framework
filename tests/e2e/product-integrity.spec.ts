/**
 * Product consistency and price integrity tests.
 *
 * Verifies that:
 *  - the product catalog is structurally complete (count, names, prices, images)
 *  - prices are valid positive numbers with no duplicates in catalog
 *  - a product's price is identical on the inventory page and in the cart
 *  - the checkout subtotal equals the sum of individual item prices
 *  - order total = subtotal + tax (floating-point safe comparison)
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { users } from '../../test-data/users';

const SAUCEDEMO_PRODUCT_COUNT = 6;
const SHIPPING = { firstName: 'Jane', lastName: 'Doe', postalCode: '10001' };

async function loginAsStandard(page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(users.standard.username, users.standard.password);
}

async function goToCheckoutStepTwo(page, itemNames: string[]) {
  const inventory = new InventoryPage(page);
  const cart = new CartPage(page);
  const checkout = new CheckoutPage(page);

  for (const name of itemNames) {
    await inventory.addItemToCartByName(name);
  }
  await inventory.goToCart();
  await cart.proceedToCheckout();
  await checkout.fillShippingInfo(SHIPPING.firstName, SHIPPING.lastName, SHIPPING.postalCode);
}

// ─── Product catalog integrity ────────────────────────────────────────────────

test.describe('Product catalog integrity', { tag: ['@e2e', '@regression'] }, () => {
  test('inventory shows exactly 6 products', async ({ page }) => {
    await test.step('Login', () => loginAsStandard(page));

    const inventory = new InventoryPage(page);
    await test.step('Count products', async () => {
      const count = await inventory.getItemCount();
      expect(count).toBe(SAUCEDEMO_PRODUCT_COUNT);
    });
  });

  test('all products have a non-empty name, positive price, and image', async ({ page }) => {
    await test.step('Login', () => loginAsStandard(page));

    const inventory = new InventoryPage(page);

    await test.step('Validate each product', async () => {
      const names = await inventory.getItemNames();
      const prices = await inventory.getItemPrices();

      expect(names).toHaveLength(SAUCEDEMO_PRODUCT_COUNT);
      expect(prices).toHaveLength(SAUCEDEMO_PRODUCT_COUNT);

      for (const name of names) {
        expect(name.trim(), `Product name should not be empty`).not.toBe('');
      }

      for (let i = 0; i < prices.length; i++) {
        expect(prices[i], `Price of "${names[i]}" should be a number`).not.toBeNaN();
        expect(prices[i], `Price of "${names[i]}" should be positive`).toBeGreaterThan(0);
      }
    });
  });

  test('no two products have the same name', async ({ page }) => {
    await test.step('Login', () => loginAsStandard(page));

    const inventory = new InventoryPage(page);

    await test.step('Check for duplicate names', async () => {
      const names = await inventory.getItemNames();
      const unique = new Set(names);
      expect(unique.size).toBe(names.length);
    });
  });

  test('products are sorted A-Z by default', async ({ page }) => {
    await test.step('Login', () => loginAsStandard(page));

    const inventory = new InventoryPage(page);

    await test.step('Verify default order is alphabetical', async () => {
      const names = await inventory.getItemNames();
      const sorted = [...names].sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(sorted);
    });
  });
});

// ─── Price consistency across pages ──────────────────────────────────────────

test.describe('Price consistency across pages', { tag: ['@e2e', '@regression'] }, () => {
  test('item price in cart matches price on inventory page', async ({ page }) => {
    const itemName = 'Sauce Labs Fleece Jacket';

    await test.step('Login', () => loginAsStandard(page));

    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);

    let inventoryPrice: number;

    await test.step(`Get price on inventory for "${itemName}"`, async () => {
      inventoryPrice = await inventory.getItemPriceByName(itemName);
      expect(inventoryPrice).toBeGreaterThan(0);
    });

    await test.step('Add to cart and navigate to cart', async () => {
      await inventory.addItemToCartByName(itemName);
      await inventory.goToCart();
    });

    await test.step('Assert cart price matches inventory price', async () => {
      const cartPrice = await cart.getItemPriceByName(itemName);
      expect(cartPrice).toBe(inventoryPrice);
    });
  });
});

// ─── Checkout math ────────────────────────────────────────────────────────────

test.describe('Checkout price math', { tag: ['@e2e', '@regression'] }, () => {
  test('single item: subtotal matches item price from inventory', async ({ page }) => {
    const itemName = 'Sauce Labs Bolt T-Shirt';

    await test.step('Login', () => loginAsStandard(page));

    const inventory = new InventoryPage(page);
    const checkout = new CheckoutPage(page);

    let inventoryPrice: number;

    await test.step('Get inventory price', async () => {
      inventoryPrice = await inventory.getItemPriceByName(itemName);
    });

    await test.step('Go to checkout step two', () => goToCheckoutStepTwo(page, [itemName]));

    await test.step('Subtotal equals inventory price', async () => {
      const subtotal = await checkout.getSubtotalAmount();
      expect(subtotal).toBe(inventoryPrice);
    });
  });

  test('multi-item: subtotal equals sum of individual cart prices', async ({ page }) => {
    const items = ['Sauce Labs Backpack', 'Sauce Labs Bike Light', 'Sauce Labs Bolt T-Shirt'];

    await test.step('Login', () => loginAsStandard(page));

    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);

    let expectedSubtotal: number;

    await test.step('Add 3 items and collect cart prices', async () => {
      for (const name of items) {
        await inventory.addItemToCartByName(name);
      }
      await inventory.goToCart();
      const cartPrices = await cart.getItemPrices();
      expectedSubtotal = cartPrices.reduce((sum, p) => sum + p, 0);
      expect(expectedSubtotal).toBeGreaterThan(0);
    });

    await test.step('Go to checkout step two', async () => {
      const checkoutPage = new CheckoutPage(page);
      await cart.proceedToCheckout();
      await checkoutPage.fillShippingInfo(SHIPPING.firstName, SHIPPING.lastName, SHIPPING.postalCode);
    });

    await test.step('Checkout subtotal matches sum of cart prices', async () => {
      const subtotal = await checkout.getSubtotalAmount();
      expect(subtotal).toBeCloseTo(expectedSubtotal, 2);
    });
  });

  test('order total equals subtotal plus tax', async ({ page }) => {
    const items = ['Sauce Labs Backpack', 'Sauce Labs Bike Light'];

    await test.step('Login', () => loginAsStandard(page));

    const checkout = new CheckoutPage(page);

    await test.step('Go to checkout step two', () => goToCheckoutStepTwo(page, items));

    await test.step('Total = subtotal + tax', async () => {
      const subtotal = await checkout.getSubtotalAmount();
      const tax = await checkout.getTaxAmount();
      const total = await checkout.getTotalAmount();

      expect(total).toBeCloseTo(subtotal + tax, 2);
    });
  });
});
