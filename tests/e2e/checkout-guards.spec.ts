/**
 * Checkout route guard and state integrity tests.
 *
 * Verifies that checkout pages are protected behind auth,
 * and that checkout state is consistent when cart is empty.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { users } from '../../test-data/users';

const SHIPPING = { firstName: 'Jane', lastName: 'Doe', postalCode: '10001' };

// ─── Route guards: unauthenticated access ─────────────────────────────────────

test.describe('Route guards – unauthenticated', { tag: ['@e2e', '@regression'] }, () => {
  for (const { path, label } of [
    { path: '/checkout-step-one.html', label: 'checkout step one' },
    { path: '/checkout-step-two.html', label: 'checkout step two' },
    { path: '/checkout-complete.html', label: 'checkout complete' },
  ]) {
    test(`direct access to ${label} without login redirects to home`, async ({ page }) => {
      await test.step(`Navigate directly to ${path}`, async () => {
        await page.goto(`https://www.saucedemo.com${path}`);
      });

      await test.step('Assert redirect to login', async () => {
        await expect(page).toHaveURL('https://www.saucedemo.com/');
        await expect(page.locator('#login-button')).toBeVisible();
      });
    });
  }
});

// ─── Route guards: post-logout ────────────────────────────────────────────────

test.describe('Route guards – post-logout', { tag: ['@e2e', '@regression'] }, () => {
  test('after logout, direct URL to checkout step one redirects to login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);

    await test.step('Login then logout', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.expectPageLoaded();
      await inventory.logout();
    });

    await test.step('Try to access checkout directly', async () => {
      await page.goto('https://www.saucedemo.com/checkout-step-one.html');
    });

    await test.step('Assert redirect to login', async () => {
      await expect(page).toHaveURL('https://www.saucedemo.com/');
    });
  });
});

// ─── Empty cart checkout ──────────────────────────────────────────────────────

test.describe('Empty cart checkout state', { tag: ['@e2e', '@regression'] }, () => {
  test('checkout with empty cart shows no items on step two', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);

    await test.step('Login with no items in cart', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.expectCartCount(0);
    });

    await test.step('Navigate to cart and start checkout', async () => {
      await cart.goto();
      await cart.proceedToCheckout();
    });

    await test.step('Fill step one and proceed', async () => {
      await checkout.fillShippingInfo(SHIPPING.firstName, SHIPPING.lastName, SHIPPING.postalCode);
    });

    await test.step('Step two summary is empty — SauceDemo allows 0-item checkout', async () => {
      await checkout.expectOnStepTwo();
      await checkout.expectSummaryEmpty();
    });
  });

  test('after Reset App State, checkout step two shows empty summary', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);

    await test.step('Login, add item, then reset cart', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.addItemToCartByName('Sauce Labs Backpack');
      await inventory.expectCartCount(1);
      await inventory.resetAppState();
      await inventory.expectCartCount(0);
    });

    await test.step('Checkout with now-empty cart', async () => {
      await cart.goto();
      await cart.proceedToCheckout();
      await checkout.fillShippingInfo(SHIPPING.firstName, SHIPPING.lastName, SHIPPING.postalCode);
    });

    await test.step('Summary is empty after reset', async () => {
      await checkout.expectOnStepTwo();
      await checkout.expectSummaryEmpty();
    });
  });
});
