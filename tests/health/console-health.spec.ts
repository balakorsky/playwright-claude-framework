/**
 * Console health — systematic per-page scan.
 *
 * Unlike the e2e observability tests that monitor specific flows,
 * this suite navigates to every application page and asserts:
 *  - zero console errors on standard_user pages
 *  - zero unhandled promise rejections
 *  - warnings are counted and logged for trend tracking
 *
 * problem_user and error_user sections document known console noise
 * so that any future change in error count is immediately visible.
 */

import { test, expect } from '../../fixtures/healthFixture';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { users } from '../../test-data/users';

async function loginAs(page, user: { username: string; password: string }) {
  const lp = new LoginPage(page);
  await lp.goto();
  await lp.login(user.username, user.password);
  await new InventoryPage(page).expectPageLoaded();
}

// ─── standard_user — every page must be console-clean ────────────────────────

test.describe('standard_user — zero console errors on every page', { tag: ['@health', '@regression'] }, () => {
  test('login page load produces no console errors', async ({ page, health }) => {
    await test.step('Navigate to login page', async () => {
      await page.goto('https://www.saucedemo.com/');
    });
    await test.step(`Health: ${health.summary()}`, async () => {
      health.assertNoConsoleErrors();
    });
  });

  test('inventory page produces no console errors', async ({ page, health }) => {
    await test.step('Login and load inventory', () => loginAs(page, users.standard));
    await test.step(`Health: ${health.summary()}`, () => health.assertNoConsoleErrors());
  });

  test('product detail page produces no console errors', async ({ page, health }) => {
    await test.step('Open detail page', async () => {
      await loginAs(page, users.standard);
      await new InventoryPage(page).openProductDetailByName('Sauce Labs Backpack');
    });
    await test.step(`Health: ${health.summary()}`, () => health.assertNoConsoleErrors());
  });

  test('cart page produces no console errors', async ({ page, health }) => {
    await test.step('Load cart page', async () => {
      await loginAs(page, users.standard);
      await new CartPage(page).goto();
    });
    await test.step(`Health: ${health.summary()}`, () => health.assertNoConsoleErrors());
  });

  test('checkout step one produces no console errors', async ({ page, health }) => {
    await test.step('Reach step one', async () => {
      await loginAs(page, users.standard);
      const inv = new InventoryPage(page);
      await inv.addItemToCartByName('Sauce Labs Backpack');
      const cart = new CartPage(page);
      await cart.goto();
      await cart.proceedToCheckout();
    });
    await test.step(`Health: ${health.summary()}`, () => health.assertNoConsoleErrors());
  });

  test('checkout step two produces no console errors', async ({ page, health }) => {
    await test.step('Reach step two', async () => {
      await loginAs(page, users.standard);
      const inv = new InventoryPage(page);
      await inv.addItemToCartByName('Sauce Labs Backpack');
      const cart = new CartPage(page);
      await cart.goto();
      await cart.proceedToCheckout();
      await new CheckoutPage(page).fillShippingInfo('Jane', 'Doe', '10001');
    });
    await test.step(`Health: ${health.summary()}`, () => health.assertNoConsoleErrors());
  });

  test('checkout complete page produces no console errors', async ({ page, health }) => {
    await test.step('Complete an order', async () => {
      await loginAs(page, users.standard);
      const inv = new InventoryPage(page);
      await inv.addItemToCartByName('Sauce Labs Backpack');
      const cart = new CartPage(page);
      await cart.goto();
      await cart.proceedToCheckout();
      const checkout = new CheckoutPage(page);
      await checkout.fillShippingInfo('Jane', 'Doe', '10001');
      await checkout.finish();
    });
    await test.step(`Health: ${health.summary()}`, () => health.assertNoConsoleErrors());
  });

  test('sort cycling produces no console errors', async ({ page, health }) => {
    await test.step('Apply each sort option', async () => {
      await loginAs(page, users.standard);
      const inv = new InventoryPage(page);
      for (const opt of ['za', 'lohi', 'hilo', 'az'] as const) {
        await inv.sortBy(opt);
      }
    });
    await test.step(`Health: ${health.summary()}`, () => health.assertNoConsoleErrors());
  });
});

// ─── Unhandled promise rejections ────────────────────────────────────────────

test.describe('No unhandled promise rejections on any page', { tag: ['@health', '@regression'] }, () => {
  test('inventory page has no unhandled promise rejections', async ({ page, health }) => {
    const rejections: string[] = [];
    page.on('pageerror', (err) => rejections.push(err.message));

    await test.step('Load inventory', () => loginAs(page, users.standard));

    await test.step('No unhandled rejections', () => {
      expect(
        rejections,
        `Unhandled promise rejections: ${rejections.join(', ')}`,
      ).toHaveLength(0);
    });
  });

  test('full checkout flow has no unhandled promise rejections', async ({ page, health }) => {
    const rejections: string[] = [];
    page.on('pageerror', (err) => rejections.push(err.message));

    await test.step('Run full checkout', async () => {
      await loginAs(page, users.standard);
      const inv = new InventoryPage(page);
      await inv.addItemToCartByName('Sauce Labs Backpack');
      const cart = new CartPage(page);
      await cart.goto();
      await cart.proceedToCheckout();
      const checkout = new CheckoutPage(page);
      await checkout.fillShippingInfo('Jane', 'Doe', '10001');
      await checkout.finish();
    });

    await test.step('No unhandled rejections', () => {
      expect(rejections, `Rejections: ${rejections.join(', ')}`).toHaveLength(0);
    });
  });
});

// ─── problem_user and error_user — document error counts ─────────────────────

test.describe('Broken users — console error count baseline', { tag: ['@health', '@regression'] }, () => {
  for (const { key, label } of [
    { key: 'problem' as const, label: 'problem_user' },
    { key: 'error' as const, label: 'error_user' },
  ]) {
    test(`${label} inventory + sort console error count is logged`, async ({ page, health }) => {
      await test.step('Login and interact with inventory', async () => {
        await loginAs(page, users[key]);
        const inv = new InventoryPage(page);
        await inv.sortBy('za');
        await inv.addItemToCartByName('Sauce Labs Backpack');
      });

      await test.step('Log error count (not asserting — documenting baseline)', () => {
        // This test always passes. Its value is in the logged count:
        // if the number changes between runs, the CI diff shows it.
        console.log(`[${label}] ${health.summary()}`);
        console.log(`[${label}] errors:`, health.consoleErrors);
      });
    });
  }
});
