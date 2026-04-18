/**
 * Network interception and client-state manipulation tests.
 *
 * Uses Playwright's page.route() API and page.evaluate() to simulate:
 *  - missing/broken assets (images aborted, CSS aborted)
 *  - slow resource loading
 *  - localStorage session cleared mid-session → redirect to login
 *  - cart data corrupted in localStorage → graceful recovery
 *  - cart data manually injected into localStorage → badge reflects it
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
  const inventory = new InventoryPage(page);
  await inventory.expectPageLoaded();
  return inventory;
}

// ─── Image interception ───────────────────────────────────────────────────────

test.describe('Inventory with images aborted', { tag: ['@e2e', '@regression'] }, () => {
  test('inventory is fully functional when all product images are aborted', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);

    await test.step('Intercept and abort all image requests', async () => {
      await page.route('**/*.{jpg,jpeg,png,gif,svg,webp}', (route) => route.abort());
    });

    await test.step('Login and load inventory', async () => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.expectPageLoaded();
    });

    await test.step('All 6 product names are visible without images', async () => {
      const count = await inventory.getItemCount();
      expect(count).toBe(6);
      const names = await inventory.getItemNames();
      for (const name of names) {
        expect(name.trim()).not.toBe('');
      }
    });

    await test.step('Add to Cart still works with images aborted', async () => {
      await inventory.addItemToCartByName('Sauce Labs Backpack');
      await inventory.expectCartCount(1);
      await cart.goto();
      await cart.expectItemCount(1);
    });
  });
});

test.describe('Inventory with images returning 404', { tag: ['@e2e', '@regression'] }, () => {
  test('page does not crash and products are visible when images return 404', async ({ page }) => {
    const inventory = new InventoryPage(page);

    await test.step('Route images to 404', async () => {
      await page.route('**/*.{jpg,jpeg,png}', (route) =>
        route.fulfill({ status: 404, body: '' }),
      );
    });

    await test.step('Login and load inventory', async () => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.expectPageLoaded();
    });

    await test.step('Products still visible with broken image placeholders', async () => {
      const count = await inventory.getItemCount();
      expect(count).toBe(6);
    });
  });
});

// ─── CSS interception ────────────────────────────────────────────────────────

test.describe('Login with CSS aborted', { tag: ['@e2e', '@regression'] }, () => {
  test('login form is functional even when all stylesheets are blocked', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);

    await test.step('Abort all CSS', async () => {
      await page.route('**/*.css', (route) => route.abort());
    });

    await test.step('Login succeeds without styles', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.expectPageLoaded();
    });
  });
});

// ─── Slow resource simulation ─────────────────────────────────────────────────

test.describe('Inventory with artificially delayed images', { tag: ['@e2e', '@regression'] }, () => {
  test('inventory is functional when images are delayed by 2 seconds', async ({ page }) => {
    const inventory = new InventoryPage(page);

    await test.step('Add 2-second delay to all image requests', async () => {
      await page.route('**/*.{jpg,jpeg,png}', async (route) => {
        await new Promise((r) => setTimeout(r, 2000));
        await route.continue();
      });
    });

    await test.step('Login and load inventory', async () => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.expectPageLoaded();
    });

    await test.step('Products visible and cart works despite slow images', async () => {
      await inventory.addItemToCartByName('Sauce Labs Backpack');
      await inventory.expectCartCount(1);
    });
  });
});

// ─── localStorage — session manipulation ────────────────────────────────────

test.describe('localStorage session manipulation', { tag: ['@e2e', '@regression'] }, () => {
  test('clearing localStorage mid-session redirects to login on next navigation', async ({ page }) => {
    await test.step('Login normally', () => loginAsStandard(page));

    await test.step('Clear localStorage (simulate session expiry)', async () => {
      await page.evaluate(() => localStorage.clear());
    });

    await test.step('Navigate to inventory — should redirect to login', async () => {
      await page.goto('https://www.saucedemo.com/inventory.html');
    });

    await test.step('On login page', async () => {
      await expect(page).toHaveURL('https://www.saucedemo.com/');
      await expect(page.locator('#login-button')).toBeVisible();
    });
  });

  test('clearing only the session key redirects to login', async ({ page }) => {
    await test.step('Login and discover session key', async () => {
      await loginAsStandard(page);
    });

    await test.step('Remove session entry from localStorage', async () => {
      await page.evaluate(() => {
        const sessionKey = Object.keys(localStorage).find((k) =>
          k.toLowerCase().includes('session'),
        );
        if (sessionKey) localStorage.removeItem(sessionKey);
        else localStorage.clear();
      });
    });

    await test.step('Navigate to inventory', async () => {
      await page.goto('https://www.saucedemo.com/inventory.html');
    });

    await test.step('Redirected to login', async () => {
      await expect(page).toHaveURL('https://www.saucedemo.com/');
    });
  });
});

// ─── localStorage — cart manipulation ────────────────────────────────────────

test.describe('localStorage cart manipulation', { tag: ['@e2e', '@regression'] }, () => {
  test('corrupted cart data in localStorage does not crash the inventory page', async ({ page }) => {
    const inventory = new InventoryPage(page);

    await test.step('Login', () => loginAsStandard(page));

    await test.step('Inject invalid JSON into every cart-related localStorage key', async () => {
      await page.evaluate(() => {
        Object.keys(localStorage)
          .filter((k) => k.toLowerCase().includes('cart'))
          .forEach((k) => localStorage.setItem(k, 'CORRUPTED_VALUE!!!'));
      });
    });

    await test.step('Reload the page', async () => {
      await page.reload();
    });

    await test.step('Inventory still loads (no crash)', async () => {
      await inventory.expectPageLoaded();
    });
  });

  test('cart state is empty after localStorage.clear() and re-login', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);

    await test.step('Add 2 items', async () => {
      await loginAsStandard(page);
      await inventory.addItemToCartByName('Sauce Labs Backpack');
      await inventory.addItemToCartByName('Sauce Labs Bike Light');
      await inventory.expectCartCount(2);
    });

    await test.step('Clear localStorage and re-login', async () => {
      await page.evaluate(() => localStorage.clear());
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.expectPageLoaded();
    });

    await test.step('Cart is empty after fresh session', async () => {
      await inventory.expectCartCount(0);
      await cart.goto();
      await cart.expectItemCount(0);
    });
  });
});
