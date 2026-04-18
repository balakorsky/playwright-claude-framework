/**
 * Multi-tab consistency tests.
 *
 * Two pages created from the SAME BrowserContext share localStorage —
 * this mirrors how a real user with two open browser tabs behaves.
 *
 * Because SauceDemo stores auth and cart entirely in localStorage:
 *  - changes made in tab A are immediately in the shared storage
 *  - tab B sees those changes on its next navigation or reload
 *
 * Scenarios:
 *  - cart change in A → reload B → B reflects new state
 *  - logout in A → navigate B → B redirected to login
 *  - Reset App State in A → reload B → B shows empty cart
 *  - different user login in B → A sees the overwritten session and shared cart storage
 */

import { test, expect } from '../../fixtures/healthFixture';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { users } from '../../test-data/users';

async function loginAs(page, user: { username: string; password: string }) {
  const lp = new LoginPage(page);
  await lp.goto();
  await lp.login(user.username, user.password);
  await new InventoryPage(page).expectPageLoaded();
}

// ─── Cart state propagation ───────────────────────────────────────────────────

test.describe('Cart state propagates between tabs (shared localStorage)', { tag: ['@health', '@regression'] }, () => {
  test('item added in tab A appears in tab B after reload', async ({ context }) => {
    const tabA = await context.newPage();
    const tabB = await context.newPage();

    await test.step('Login in tab A', () => loginAs(tabA, users.standard));
    await test.step('Open inventory in tab B (same session via shared storage)', async () => {
      await tabB.goto('https://www.saucedemo.com/inventory.html');
    });

    await test.step('Add item in tab A', async () => {
      await new InventoryPage(tabA).addItemToCartByName('Sauce Labs Backpack');
      await new InventoryPage(tabA).expectCartCount(1);
    });

    await test.step('Reload tab B — cart badge reflects tab A addition', async () => {
      await tabB.reload();
      await new InventoryPage(tabB).expectCartCount(1);
    });
  });

  test('item removed in tab A disappears in tab B after reload', async ({ context }) => {
    const tabA = await context.newPage();
    const tabB = await context.newPage();

    await test.step('Login and add item in tab A', async () => {
      await loginAs(tabA, users.standard);
      await new InventoryPage(tabA).addItemToCartByName('Sauce Labs Backpack');
    });

    await test.step('Tab B reflects the cart', async () => {
      await tabB.goto('https://www.saucedemo.com/inventory.html');
      await new InventoryPage(tabB).expectCartCount(1);
    });

    await test.step('Remove item in tab A', async () => {
      await new InventoryPage(tabA).removeItemFromCartByName('Sauce Labs Backpack');
      await new InventoryPage(tabA).expectCartCount(0);
    });

    await test.step('Reload tab B — badge is gone', async () => {
      await tabB.reload();
      await new InventoryPage(tabB).expectCartCount(0);
    });
  });

  test('cart page in tab B shows items added in tab A', async ({ context }) => {
    const tabA = await context.newPage();
    const tabB = await context.newPage();

    await test.step('Login and add 2 items in tab A', async () => {
      await loginAs(tabA, users.standard);
      const inv = new InventoryPage(tabA);
      await inv.addItemToCartByName('Sauce Labs Backpack');
      await inv.addItemToCartByName('Sauce Labs Bike Light');
    });

    await test.step('Tab B cart page shows 2 items after load', async () => {
      await tabB.goto('https://www.saucedemo.com/cart.html');
      const cart = new CartPage(tabB);
      await cart.expectItemCount(2);
      await cart.expectItemInCart('Sauce Labs Backpack');
      await cart.expectItemInCart('Sauce Labs Bike Light');
    });
  });
});

// ─── Logout propagation ───────────────────────────────────────────────────────

test.describe('Logout in one tab invalidates the other tab', { tag: ['@health', '@regression'] }, () => {
  test('logout in tab A redirects tab B to login on next navigation', async ({ context }) => {
    const tabA = await context.newPage();
    const tabB = await context.newPage();

    await test.step('Login in tab A, tab B loads inventory', async () => {
      await loginAs(tabA, users.standard);
      await tabB.goto('https://www.saucedemo.com/inventory.html');
      await new InventoryPage(tabB).expectPageLoaded();
    });

    await test.step('Logout in tab A', async () => {
      await new InventoryPage(tabA).logout();
      await expect(tabA).toHaveURL('https://www.saucedemo.com/');
    });

    await test.step('Tab B navigates to inventory — redirected to login', async () => {
      await tabB.goto('https://www.saucedemo.com/inventory.html');
      await expect(tabB).toHaveURL('https://www.saucedemo.com/');
      await expect(tabB.locator('#login-button')).toBeVisible();
    });
  });

  test('cart persists in tab B after logout and re-login in tab A', async ({ context }) => {
    const tabA = await context.newPage();
    const tabB = await context.newPage();

    await test.step('Add items in tab A', async () => {
      await loginAs(tabA, users.standard);
      await new InventoryPage(tabA).addItemToCartByName('Sauce Labs Backpack');
      await new InventoryPage(tabA).expectCartCount(1);
    });

    await test.step('Logout and re-login in tab A', async () => {
      await new InventoryPage(tabA).logout();
      await loginAs(tabA, users.standard);
    });

    await test.step('Tab B still sees shared local cart storage', async () => {
      await tabB.goto('https://www.saucedemo.com/inventory.html');
      await new InventoryPage(tabB).expectCartCount(1);
    });
  });
});

// ─── Reset App State propagation ─────────────────────────────────────────────

test.describe('Reset App State propagates across tabs', { tag: ['@health', '@regression'] }, () => {
  test('Reset App State in tab A clears cart in tab B after reload', async ({ context }) => {
    const tabA = await context.newPage();
    const tabB = await context.newPage();

    await test.step('Add items in tab A, tab B sees same cart', async () => {
      await loginAs(tabA, users.standard);
      await new InventoryPage(tabA).addItemToCartByName('Sauce Labs Backpack');
      await new InventoryPage(tabA).addItemToCartByName('Sauce Labs Bike Light');
      await tabB.goto('https://www.saucedemo.com/inventory.html');
      await new InventoryPage(tabB).expectCartCount(2);
    });

    await test.step('Reset App State in tab A', async () => {
      await new InventoryPage(tabA).resetAppState();
      await new InventoryPage(tabA).expectCartCount(0);
    });

    await test.step('Reload tab B — cart is empty', async () => {
      await tabB.reload();
      await new InventoryPage(tabB).expectCartCount(0);
    });
  });
});

// ─── Session overwrite (different user in second tab) ────────────────────────

test.describe('Second tab login overwrites session for first tab', { tag: ['@health', '@regression'] }, () => {
  test('tab B login as different user invalidates tab A on next navigation', async ({ context }) => {
    const tabA = await context.newPage();
    const tabB = await context.newPage();

    await test.step('Login as standard_user in tab A, add items', async () => {
      await loginAs(tabA, users.standard);
      await new InventoryPage(tabA).addItemToCartByName('Sauce Labs Backpack');
      await new InventoryPage(tabA).expectCartCount(1);
    });

    await test.step('Login as error_user in tab B (overwrites session cookie)', async () => {
      await loginAs(tabB, users.error);
      await new InventoryPage(tabB).expectCartCount(1);
    });

    await test.step('Tab A navigates — session is now error_user, cart storage remains shared', async () => {
      await tabA.goto('https://www.saucedemo.com/inventory.html');
      await new InventoryPage(tabA).expectCartCount(1);
    });
  });

  test('two tabs adding different items — cart contains both', async ({ context }) => {
    const tabA = await context.newPage();
    const tabB = await context.newPage();

    await test.step('Login in tab A', () => loginAs(tabA, users.standard));
    await test.step('Tab B loads same session', async () => {
      await tabB.goto('https://www.saucedemo.com/inventory.html');
    });

    await test.step('Tab A adds Backpack', async () => {
      await new InventoryPage(tabA).addItemToCartByName('Sauce Labs Backpack');
    });

    await test.step('Tab B adds Bike Light (reload first to see current state)', async () => {
      await tabB.reload();
      await new InventoryPage(tabB).addItemToCartByName('Sauce Labs Bike Light');
    });

    await test.step('Tab A reloads — cart has both items', async () => {
      await tabA.reload();
      await new InventoryPage(tabA).expectCartCount(2);
      const cart = new CartPage(tabA);
      await cart.goto();
      await cart.expectItemInCart('Sauce Labs Backpack');
      await cart.expectItemInCart('Sauce Labs Bike Light');
    });
  });
});
