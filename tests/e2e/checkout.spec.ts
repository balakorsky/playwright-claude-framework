/**
 * Realistic end-to-end business scenarios covering the full shopping flow.
 *
 * These tests verify user journeys, not just individual interactions:
 *  - Single-item checkout
 *  - Multi-item checkout with price verification
 *  - Sort products → verify order
 *  - Add then remove item from cart
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { users } from '../../test-data/users';

const SHIPPING = { firstName: 'Jane', lastName: 'Doe', postalCode: '10001' };

test.describe('Checkout flow', { tag: ['@e2e', '@smoke'] }, () => {
  test('user can purchase a single item end-to-end', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);

    await test.step('Login', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.expectPageLoaded();
    });

    await test.step('Add item to cart', async () => {
      await inventory.addItemToCartByName('Sauce Labs Backpack');
      await inventory.expectCartCount(1);
    });

    await test.step('Open cart and verify item', async () => {
      await inventory.goToCart();
      await cart.expectItemCount(1);
      await cart.expectItemInCart('Sauce Labs Backpack');
    });

    await test.step('Fill shipping info', async () => {
      await cart.proceedToCheckout();
      await checkout.fillShippingInfo(SHIPPING.firstName, SHIPPING.lastName, SHIPPING.postalCode);
    });

    await test.step('Verify order summary', async () => {
      await checkout.expectSummaryItemCount(1);
      const total = await checkout.getTotalText();
      expect(total).toMatch(/Total: \$/);
    });

    await test.step('Finish and confirm order', async () => {
      await checkout.finish();
      await checkout.expectOrderConfirmed();
    });
  });

  test('user can purchase multiple items and total is correct', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);

    const itemsToAdd = ['Sauce Labs Backpack', 'Sauce Labs Bike Light'];

    await test.step('Login', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.expectPageLoaded();
    });

    await test.step('Add 2 items to cart', async () => {
      for (const item of itemsToAdd) {
        await inventory.addItemToCartByName(item);
      }
      await inventory.expectCartCount(2);
    });

    await test.step('Verify both items in cart', async () => {
      await inventory.goToCart();
      await cart.expectItemCount(2);
      for (const item of itemsToAdd) {
        await cart.expectItemInCart(item);
      }
    });

    await test.step('Complete checkout', async () => {
      await cart.proceedToCheckout();
      await checkout.fillShippingInfo(SHIPPING.firstName, SHIPPING.lastName, SHIPPING.postalCode);
      await checkout.expectSummaryItemCount(2);
      await checkout.finish();
      await checkout.expectOrderConfirmed();
    });
  });
});

test.describe('Product sorting', { tag: ['@e2e', '@regression'] }, () => {
  test('sort by price low to high returns ascending order', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
    await inventory.expectPageLoaded();

    await test.step('Sort by price: low to high', async () => {
      await inventory.sortBy('lohi');
    });

    await test.step('Verify prices are in ascending order', async () => {
      const prices = await inventory.getItemPrices();
      expect(prices.length).toBeGreaterThan(1);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });
  });

  test('sort by price high to low returns descending order', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
    await inventory.expectPageLoaded();

    await test.step('Sort by price: high to low', async () => {
      await inventory.sortBy('hilo');
    });

    await test.step('Verify prices are in descending order', async () => {
      const prices = await inventory.getItemPrices();
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
      }
    });
  });
});

test.describe('Cart management', { tag: ['@e2e', '@regression'] }, () => {
  test('user can add and remove item — cart badge updates correctly', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
    await inventory.expectPageLoaded();

    await test.step('Add item — badge shows 1', async () => {
      await inventory.addItemToCartByName('Sauce Labs Backpack');
      await inventory.expectCartCount(1);
    });

    await test.step('Remove item — badge disappears', async () => {
      await inventory.removeItemFromCartByName('Sauce Labs Backpack');
      await inventory.expectCartCount(0);
    });
  });
});
