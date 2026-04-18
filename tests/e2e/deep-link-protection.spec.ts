/**
 * Deep-link protection tests.
 *
 * Verifies that private URLs are protected against:
 *  - unauthenticated direct access (redirects to login)
 *  - post-logout direct access (redirects to login)
 *
 * Also documents SauceDemo's soft protection on checkout URLs for authenticated users:
 *  - /checkout-step-two.html without going through step one loads but shows empty summary
 *  - /checkout-complete.html without finishing loads the complete page (no real guard)
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { users } from '../../test-data/users';

// SauceDemo item detail URL (Sauce Labs Backpack, id=4)
const DETAIL_URL = 'https://www.saucedemo.com/inventory-item.html?id=4';

// ─── Unauthenticated deep-link access ────────────────────────────────────────

test.describe('Unauthenticated deep-link access', { tag: ['@e2e', '@regression'] }, () => {
  for (const { path, label } of [
    { path: '/inventory-item.html?id=4', label: 'item detail' },
    { path: '/cart.html',                label: 'cart' },
    { path: '/checkout-step-one.html',   label: 'checkout step one' },
    { path: '/checkout-step-two.html',   label: 'checkout step two' },
    { path: '/checkout-complete.html',   label: 'checkout complete' },
  ]) {
    test(`direct URL to ${label} without login redirects to home`, async ({ page }) => {
      await test.step(`Navigate directly to ${path}`, async () => {
        await page.goto(`https://www.saucedemo.com${path}`);
      });

      await test.step('Redirected to login page', async () => {
        await expect(page).toHaveURL('https://www.saucedemo.com/');
        await expect(page.locator('#login-button')).toBeVisible();
      });
    });
  }
});

// ─── Post-logout deep-link access ────────────────────────────────────────────

test.describe('Post-logout deep-link access', { tag: ['@e2e', '@regression'] }, () => {
  for (const { path, label } of [
    { path: '/inventory-item.html?id=4', label: 'item detail' },
    { path: '/cart.html',                label: 'cart' },
    { path: '/checkout-step-one.html',   label: 'checkout step one' },
  ]) {
    test(`after logout, direct URL to ${label} redirects to login`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const inventory = new InventoryPage(page);

      await test.step('Login then logout', async () => {
        await loginPage.goto();
        await loginPage.login(users.standard.username, users.standard.password);
        await inventory.expectPageLoaded();
        await inventory.logout();
      });

      await test.step(`Navigate directly to ${path}`, async () => {
        await page.goto(`https://www.saucedemo.com${path}`);
      });

      await test.step('Redirected to login', async () => {
        await expect(page).toHaveURL('https://www.saucedemo.com/');
        await expect(page.locator('#login-button')).toBeVisible();
      });
    });
  }
});

// ─── Authenticated deep-link quirks (SauceDemo soft protection) ──────────────

test.describe('Authenticated deep-link quirks — SauceDemo soft protection', { tag: ['@e2e', '@regression'] }, () => {
  test('direct URL to checkout-step-two while authenticated shows empty summary (no hard guard)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);

    await test.step('Login without adding items', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.expectPageLoaded();
    });

    await test.step('Navigate directly to step two', async () => {
      await page.goto('https://www.saucedemo.com/checkout-step-two.html');
    });

    await test.step('SauceDemo loads step two with empty summary — no items, no redirect', async () => {
      await expect(page).toHaveURL(/checkout-step-two/);
      await expect(page.locator('[data-test="finish"]')).toBeVisible();
      await expect(page.locator('.cart_item')).toHaveCount(0);
    });
  });

  test('direct URL to checkout-complete while authenticated shows complete page (no hard guard)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);

    await test.step('Login', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.expectPageLoaded();
    });

    await test.step('Navigate directly to complete page', async () => {
      await page.goto('https://www.saucedemo.com/checkout-complete.html');
    });

    await test.step('SauceDemo loads complete page without a real order — documents soft protection', async () => {
      await expect(page).toHaveURL(/checkout-complete/);
      await expect(page.locator('[data-test="complete-header"]')).toBeVisible();
    });
  });
});
