/**
 * Navigation shell and menu integrity tests.
 *
 * Verifies that:
 *  - burger menu links work correctly (All Items, About)
 *  - burger menu can be opened and closed without side effects
 *  - footer links are present and point to expected destinations
 *  - navigation actions (Back to Products, All Items) do not clear cart state
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { ProductDetailPage } from '../../pages/ProductDetailPage';
import { users } from '../../test-data/users';

const ITEM = 'Sauce Labs Backpack';

async function loginAsStandard(page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(users.standard.username, users.standard.password);
}

// ─── Burger menu navigation ───────────────────────────────────────────────────

test.describe('Burger menu navigation', { tag: ['@e2e', '@regression'] }, () => {
  test('All Items link returns to inventory page', async ({ page }) => {
    const inventory = new InventoryPage(page);

    await test.step('Login and navigate away to cart', async () => {
      await loginAsStandard(page);
      await page.goto('https://www.saucedemo.com/cart.html');
    });

    await test.step('Click All Items from burger menu', async () => {
      await inventory.clickAllItems();
    });

    await test.step('Inventory page is loaded', async () => {
      await inventory.expectPageLoaded();
    });
  });

  test('About link navigates to the Sauce Labs external site', async ({ page }) => {
    const inventory = new InventoryPage(page);

    await test.step('Login', () => loginAsStandard(page));

    await test.step('Click About from burger menu', async () => {
      await inventory.clickAbout();
    });

    await test.step('URL is on saucelabs.com', async () => {
      await expect(page).toHaveURL(/saucelabs\.com/);
    });
  });

  test('burger menu can be opened and closed without changing page state', async ({ page }) => {
    const inventory = new InventoryPage(page);

    await test.step('Login', () => loginAsStandard(page));

    await test.step('Open burger menu', async () => {
      await inventory.burgerMenuButton.click();
      await inventory.allItemsLink.waitFor({ state: 'visible' });
    });

    await test.step('Close burger menu', async () => {
      await inventory.closeBurgerMenu();
    });

    await test.step('Inventory page is still intact', async () => {
      await inventory.expectPageLoaded();
    });
  });

  test('burger menu items are all visible when opened', async ({ page }) => {
    const inventory = new InventoryPage(page);

    await test.step('Login and open menu', async () => {
      await loginAsStandard(page);
      await inventory.burgerMenuButton.click();
    });

    await test.step('All menu links are visible', async () => {
      await expect(inventory.allItemsLink).toBeVisible();
      await expect(inventory.aboutLink).toBeVisible();
      await expect(inventory.resetAppStateLink).toBeVisible();
      await expect(inventory.logoutLink).toBeVisible();
    });
  });
});

// ─── Footer integrity ─────────────────────────────────────────────────────────

test.describe('Footer link integrity', { tag: ['@e2e', '@regression'] }, () => {
  test('footer shows Twitter, Facebook, and LinkedIn links', async ({ page }) => {
    const inventory = new InventoryPage(page);

    await test.step('Login', () => loginAsStandard(page));

    await test.step('Footer links are visible', async () => {
      await expect(inventory.footerTwitter).toBeVisible();
      await expect(inventory.footerFacebook).toBeVisible();
      await expect(inventory.footerLinkedIn).toBeVisible();
    });
  });

  test('footer Twitter link points to twitter.com', async ({ page }) => {
    const inventory = new InventoryPage(page);
    await test.step('Login', () => loginAsStandard(page));
    await test.step('Twitter href contains twitter.com', async () => {
      const href = await inventory.footerTwitter.getAttribute('href');
      expect(href).toMatch(/twitter\.com|x\.com/);
    });
  });

  test('footer Facebook link points to facebook.com', async ({ page }) => {
    const inventory = new InventoryPage(page);
    await test.step('Login', () => loginAsStandard(page));
    await test.step('Facebook href contains facebook.com', async () => {
      const href = await inventory.footerFacebook.getAttribute('href');
      expect(href).toContain('facebook.com');
    });
  });

  test('footer LinkedIn link points to linkedin.com', async ({ page }) => {
    const inventory = new InventoryPage(page);
    await test.step('Login', () => loginAsStandard(page));
    await test.step('LinkedIn href contains linkedin.com', async () => {
      const href = await inventory.footerLinkedIn.getAttribute('href');
      expect(href).toContain('linkedin.com');
    });
  });
});

// ─── Navigation does not break cart state ────────────────────────────────────

test.describe('Cart state survives navigation actions', { tag: ['@e2e', '@regression'] }, () => {
  test('Back to Products from detail page does not clear cart', async ({ page }) => {
    const inventory = new InventoryPage(page);
    const detail = new ProductDetailPage(page);

    await test.step('Add item and open detail page', async () => {
      await loginAsStandard(page);
      await inventory.addItemToCartByName(ITEM);
      await inventory.openProductDetailByName(ITEM);
    });

    await test.step('Go back to inventory', async () => {
      await detail.goBackToInventory();
    });

    await test.step('Cart badge is still 1', async () => {
      await inventory.expectCartCount(1);
    });
  });

  test('All Items from burger menu does not clear cart', async ({ page }) => {
    const inventory = new InventoryPage(page);

    await test.step('Add item', async () => {
      await loginAsStandard(page);
      await inventory.addItemToCartByName(ITEM);
      await inventory.expectCartCount(1);
    });

    await test.step('Navigate to cart then use All Items menu link', async () => {
      await page.goto('https://www.saucedemo.com/cart.html');
      await inventory.clickAllItems();
    });

    await test.step('Cart badge is still 1', async () => {
      await inventory.expectCartCount(1);
    });
  });

  test('opening and closing burger menu does not change cart badge', async ({ page }) => {
    const inventory = new InventoryPage(page);

    await test.step('Add 2 items', async () => {
      await loginAsStandard(page);
      await inventory.addItemToCartByName(ITEM);
      await inventory.addItemToCartByName('Sauce Labs Bike Light');
      await inventory.expectCartCount(2);
    });

    await test.step('Open and close burger menu', async () => {
      await inventory.burgerMenuButton.click();
      await inventory.allItemsLink.waitFor({ state: 'visible' });
      await inventory.closeBurgerMenu();
    });

    await test.step('Badge is still 2', async () => {
      await inventory.expectCartCount(2);
    });
  });
});
