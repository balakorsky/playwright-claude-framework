/**
 * Network health tests.
 *
 * Keeps request/response failures visible as their own health signal:
 *  - every key page load should produce app responses
 *  - no saucedemo.com request should return 4xx or 5xx
 *  - static assets are covered separately from full app requests
 *  - a complete standard_user journey should stay network-clean
 */

import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/healthFixture';
import type { HealthContext } from '../../fixtures/healthFixture';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { users } from '../../test-data/users';

const SHIPPING = { firstName: 'Jane', lastName: 'Doe', postalCode: '10001' };

async function loginAs(page: Page, user: { username: string; password: string }) {
  const login = new LoginPage(page);
  await login.goto();
  await login.login(user.username, user.password);
  await new InventoryPage(page).expectPageLoaded();
}

function assertCapturedResponses(health: HealthContext, label: string) {
  expect(
    health.responses.length,
    `No app responses were captured for ${label}; network health would be a false positive.`,
  ).toBeGreaterThan(0);
}

// --- Page-level network health ------------------------------------------------

test.describe('Page loads have no failed app requests', { tag: ['@health', '@regression'] }, () => {
  const pageChecks: Array<{ label: string; navigate: (page: Page) => Promise<void> }> = [
    {
      label: 'login page',
      navigate: async (page) => {
        await page.goto('https://www.saucedemo.com/');
      },
    },
    {
      label: 'inventory page',
      navigate: async (page) => {
        await loginAs(page, users.standard);
      },
    },
    {
      label: 'product detail page',
      navigate: async (page) => {
        await loginAs(page, users.standard);
        await new InventoryPage(page).openProductDetailByName('Sauce Labs Backpack');
      },
    },
    {
      label: 'cart page',
      navigate: async (page) => {
        await loginAs(page, users.standard);
        await new CartPage(page).goto();
      },
    },
    {
      label: 'checkout step one',
      navigate: async (page) => {
        await loginAs(page, users.standard);
        const inventory = new InventoryPage(page);
        await inventory.addItemToCartByName('Sauce Labs Backpack');
        const cart = new CartPage(page);
        await cart.goto();
        await cart.proceedToCheckout();
      },
    },
    {
      label: 'checkout step two',
      navigate: async (page) => {
        await loginAs(page, users.standard);
        const inventory = new InventoryPage(page);
        await inventory.addItemToCartByName('Sauce Labs Backpack');
        const cart = new CartPage(page);
        await cart.goto();
        await cart.proceedToCheckout();
        await new CheckoutPage(page).fillShippingInfo(
          SHIPPING.firstName,
          SHIPPING.lastName,
          SHIPPING.postalCode,
        );
      },
    },
    {
      label: 'checkout complete page',
      navigate: async (page) => {
        await loginAs(page, users.standard);
        const inventory = new InventoryPage(page);
        await inventory.addItemToCartByName('Sauce Labs Backpack');
        const cart = new CartPage(page);
        await cart.goto();
        await cart.proceedToCheckout();
        const checkout = new CheckoutPage(page);
        await checkout.fillShippingInfo(SHIPPING.firstName, SHIPPING.lastName, SHIPPING.postalCode);
        await checkout.finish();
      },
    },
  ];

  for (const { label, navigate } of pageChecks) {
    test(`${label} returns no app 4xx/5xx responses`, async ({ page, health }) => {
      await test.step(`Navigate to ${label}`, () => navigate(page));

      await test.step(`Network health: ${health.summary()}`, () => {
        assertCapturedResponses(health, label);
        health.assertNoFailedAppRequests();
      });
    });
  }
});

// --- Asset request health -----------------------------------------------------

test.describe('Static assets have no failed responses', { tag: ['@health', '@regression'] }, () => {
  test('login and inventory static assets return no 4xx/5xx', async ({ page, health }) => {
    await test.step('Load login and inventory pages', async () => {
      await loginAs(page, users.standard);
    });

    await test.step(`Asset health: ${health.summary()}`, () => {
      assertCapturedResponses(health, 'login and inventory pages');
      health.assertNoFailedAssets();
    });
  });

  test('product detail and cart static assets return no 4xx/5xx', async ({ page, health }) => {
    await test.step('Load detail and cart pages', async () => {
      await loginAs(page, users.standard);
      await new InventoryPage(page).openProductDetailByName('Sauce Labs Backpack');
      await new CartPage(page).goto();
    });

    await test.step(`Asset health: ${health.summary()}`, () => {
      assertCapturedResponses(health, 'product detail and cart pages');
      health.assertNoFailedAssets();
    });
  });
});

// --- Full journey network health ---------------------------------------------

test.describe('Full standard_user journey is network-clean', { tag: ['@health', '@regression'] }, () => {
  test('login, browse, cart, checkout, and logout have no failed app requests', async ({ page, health }) => {
    await test.step('Complete a representative user journey', async () => {
      await loginAs(page, users.standard);
      const inventory = new InventoryPage(page);
      await inventory.sortBy('hilo');
      await inventory.openProductDetailByName('Sauce Labs Fleece Jacket');
      await page.locator('[data-test="back-to-products"]').click();
      await inventory.expectPageLoaded();
      await inventory.addItemToCartByName('Sauce Labs Fleece Jacket');
      await inventory.addItemToCartByName('Sauce Labs Bike Light');

      const cart = new CartPage(page);
      await cart.goto();
      await cart.expectItemCount(2);
      await cart.proceedToCheckout();

      const checkout = new CheckoutPage(page);
      await checkout.fillShippingInfo(SHIPPING.firstName, SHIPPING.lastName, SHIPPING.postalCode);
      await checkout.expectSummaryItemCount(2);
      await checkout.finish();
      await checkout.expectOnComplete();

      await checkout.clickBackHome();
      await inventory.logout();
    });

    await test.step(`Network health: ${health.summary()}`, () => {
      assertCapturedResponses(health, 'full standard_user journey');
      health.assertNoFailedAppRequests();
    });
  });
});
