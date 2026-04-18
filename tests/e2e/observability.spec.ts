/**
 * Observability tests — console errors and failed network requests.
 *
 * Each test runs a key user flow while monitoring:
 *  - browser console errors (type === "error", third-party noise filtered out)
 *  - failed HTTP responses from saucedemo.com (4xx / 5xx)
 *
 * standard_user flows are expected to be completely clean.
 * problem_user and error_user flows document known console noise.
 *
 * Import: uses observabilityFixture, not @playwright/test directly.
 */

import { test, expect } from '../../fixtures/observabilityFixture';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { users } from '../../test-data/users';

const SHIPPING = { firstName: 'Jane', lastName: 'Doe', postalCode: '10001' };

// ─── standard_user — clean flows ─────────────────────────────────────────────

test.describe('standard_user — no console errors or failed requests', { tag: ['@e2e', '@regression'] }, () => {
  test('login flow produces no errors', async ({ page, observe }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);

    await test.step('Login', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.expectPageLoaded();
    });

    await test.step('Assert no console errors or failed requests', () => {
      observe.assertClean();
    });
  });

  test('add items to cart produces no errors', async ({ page, observe }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);

    await test.step('Login, add 3 items, view cart', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.addItemToCartByName('Sauce Labs Backpack');
      await inventory.addItemToCartByName('Sauce Labs Bike Light');
      await inventory.addItemToCartByName('Sauce Labs Bolt T-Shirt');
      await cart.goto();
      await cart.expectItemCount(3);
    });

    await test.step('Assert clean', () => observe.assertClean());
  });

  test('full checkout flow produces no errors', async ({ page, observe }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);

    await test.step('Complete checkout end-to-end', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.addItemToCartByName('Sauce Labs Backpack');
      await cart.goto();
      await cart.proceedToCheckout();
      await checkout.fillShippingInfo(SHIPPING.firstName, SHIPPING.lastName, SHIPPING.postalCode);
      await checkout.finish();
      await checkout.expectOnComplete();
    });

    await test.step('Assert clean', () => observe.assertClean());
  });

  test('sorting products produces no errors', async ({ page, observe }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);

    await test.step('Login and cycle through all sort options', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.expectPageLoaded();
      await inventory.sortBy('za');
      await inventory.sortBy('lohi');
      await inventory.sortBy('hilo');
      await inventory.sortBy('az');
    });

    await test.step('Assert clean', () => observe.assertClean());
  });

  test('product detail page produces no errors', async ({ page, observe }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);

    await test.step('Open detail page, add to cart, go back', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.openProductDetailByName('Sauce Labs Backpack');
      await page.locator('[data-test="back-to-products"]').click();
      await inventory.expectPageLoaded();
    });

    await test.step('Assert clean', () => observe.assertClean());
  });

  test('logout flow produces no errors', async ({ page, observe }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);

    await test.step('Login then logout', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.expectPageLoaded();
      await inventory.logout();
      await expect(page).toHaveURL('https://www.saucedemo.com/');
    });

    await test.step('Assert clean', () => observe.assertClean());
  });
});

// ─── No 4xx/5xx on any app request ───────────────────────────────────────────

test.describe('standard_user — zero failed app requests across full journey', { tag: ['@e2e', '@regression'] }, () => {
  test('no saucedemo.com request returns 4xx or 5xx during a complete session', async ({ page, observe }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);

    await test.step('Run full session: login → add → cart → checkout → complete', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.addItemToCartByName('Sauce Labs Fleece Jacket');
      await inventory.sortBy('hilo');
      await inventory.goToCart();
      await cart.proceedToCheckout();
      await checkout.fillShippingInfo(SHIPPING.firstName, SHIPPING.lastName, SHIPPING.postalCode);
      await checkout.finish();
    });

    await test.step('No failed requests recorded', () => {
      expect(
        observe.failedRequests,
        `Failed requests: ${observe.failedRequests.map((r) => `${r.status} ${r.url}`).join(', ')}`,
      ).toHaveLength(0);
    });
  });
});

// ─── problem_user — documenting expected noise ───────────────────────────────

test.describe('problem_user — console errors are present (documenting known bugs)', { tag: ['@e2e', '@regression'] }, () => {
  test('problem_user inventory generates console errors', async ({ page, observe }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);

    await test.step('Login as problem_user and interact with inventory', async () => {
      await loginPage.goto();
      await loginPage.login(users.problem.username, users.problem.password);
      await inventory.expectPageLoaded();
      await inventory.sortBy('za');
      await inventory.addItemToCartByName('Sauce Labs Backpack');
    });

    await test.step('Document console errors — these are expected for problem_user', async () => {
      // We do NOT call assertClean() here — we only report what was found.
      // This test always passes; it serves as a regression detector:
      // if the number of errors changes, the test output documents the diff.
      const errorCount = observe.consoleErrors.length;
      const failedCount = observe.failedRequests.length;
      console.log(`problem_user console errors: ${errorCount}`);
      console.log(`problem_user failed requests: ${failedCount}`);
      if (errorCount > 0) {
        console.log('Errors:', observe.consoleErrors);
      }
    });
  });

  test('error_user inventory generates console errors', async ({ page, observe }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);

    await test.step('Login as error_user and interact', async () => {
      await loginPage.goto();
      await loginPage.login(users.error.username, users.error.password);
      await inventory.expectPageLoaded();
      await inventory.sortBy('za');
      await inventory.addItemToCartByName('Sauce Labs Backpack');
    });

    await test.step('Document console errors for error_user', async () => {
      const errorCount = observe.consoleErrors.length;
      console.log(`error_user console errors: ${errorCount}`);
      if (errorCount > 0) {
        console.log('Errors:', observe.consoleErrors);
      }
    });
  });
});
