/**
 * Session and app state tests for SauceDemo.
 *
 * Covers: protected routes, logout flow, back-button protection,
 * cart persistence across navigation, cart reset after re-login,
 * and SauceDemo's "Reset App State" burger menu action.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { users } from '../../test-data/users';

const ITEM = 'Sauce Labs Backpack';

test.describe('Protected routes', { tag: ['@e2e', '@regression'] }, () => {
  test('accessing /inventory.html without login redirects to home', async ({ page }) => {
    await test.step('Navigate directly to inventory without login', async () => {
      await page.goto('https://www.saucedemo.com/inventory.html');
    });

    await test.step('Assert redirect to login page', async () => {
      await expect(page).toHaveURL('https://www.saucedemo.com/');
    });
  });

  test('accessing /cart.html without login redirects to home', async ({ page }) => {
    await test.step('Navigate directly to cart without login', async () => {
      await page.goto('https://www.saucedemo.com/cart.html');
    });

    await test.step('Assert redirect to login page', async () => {
      await expect(page).toHaveURL('https://www.saucedemo.com/');
    });
  });
});

test.describe('Logout flow', { tag: ['@e2e', '@smoke'] }, () => {
  test('user can logout via burger menu', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);

    await test.step('Login', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.expectPageLoaded();
    });

    await test.step('Logout via burger menu', async () => {
      await inventory.logout();
    });

    await test.step('Assert back on login page', async () => {
      await expect(page).toHaveURL('https://www.saucedemo.com/');
      await expect(page.locator('#login-button')).toBeVisible();
    });
  });

  test('after logout, direct URL access redirects to login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);

    await test.step('Login then logout', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.expectPageLoaded();
      await inventory.logout();
    });

    await test.step('Try to access inventory directly', async () => {
      await page.goto('https://www.saucedemo.com/inventory.html');
    });

    await test.step('Assert redirect to login', async () => {
      await expect(page).toHaveURL('https://www.saucedemo.com/');
    });
  });

  test('browser back button after logout does not restore session', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);

    await test.step('Login then logout', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.expectPageLoaded();
      await inventory.logout();
    });

    await test.step('Press browser back', async () => {
      await page.goBack();
    });

    await test.step('Assert session is not restored', async () => {
      await expect(page).toHaveURL('https://www.saucedemo.com/');
      await expect(page.locator('#login-button')).toBeVisible();
    });
  });
});

test.describe('Cart state', { tag: ['@e2e', '@regression'] }, () => {
  test('cart badge persists after navigating away and back', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);

    await test.step('Login and add item', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.addItemToCartByName(ITEM);
      await inventory.expectCartCount(1);
    });

    await test.step('Navigate to cart and back', async () => {
      await inventory.goToCart();
      await page.goBack();
    });

    await test.step('Cart badge still shows 1', async () => {
      await inventory.expectCartCount(1);
    });
  });

  test('cart is empty after logout and re-login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);

    await test.step('Login and add item', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.addItemToCartByName(ITEM);
      await inventory.expectCartCount(1);
    });

    await test.step('Logout', async () => {
      await inventory.logout();
    });

    await test.step('Re-login', async () => {
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.expectPageLoaded();
    });

    await test.step('Cart is empty', async () => {
      await inventory.expectCartCount(0);
    });
  });

  test('Reset App State clears the cart', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);

    await test.step('Login and add item', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);
      await inventory.addItemToCartByName(ITEM);
      await inventory.expectCartCount(1);
    });

    await test.step('Reset App State via burger menu', async () => {
      await inventory.resetAppState();
    });

    await test.step('Cart badge is gone', async () => {
      await inventory.expectCartCount(0);
    });
  });
});
