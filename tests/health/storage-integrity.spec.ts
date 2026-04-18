/**
 * Storage integrity tests.
 *
 * Inspects localStorage directly to verify the application's client-side
 * data model is consistent and secure:
 *
 *  - session cookie is present after login and absent after logout
 *  - cart key is present after adding items and cleared after reset
 *  - password is never stored in localStorage
 *  - no PII or sensitive strings appear in any storage key or value
 *  - cart data is valid parseable JSON (not corrupted)
 *  - switching users overwrites the session cookie while shared cart storage persists
 *  - session cookie value matches the logged-in username
 */

import { test, expect } from '../../fixtures/healthFixture';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { users } from '../../test-data/users';

/** Returns the full localStorage contents as a plain object. */
async function getStorage(page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const result: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      result[key] = localStorage.getItem(key) ?? '';
    }
    return result;
  });
}

async function getSessionUsernameCookie(page): Promise<string | undefined> {
  const cookies = await page.context().cookies('https://www.saucedemo.com/');
  return cookies.find((cookie) => cookie.name === 'session-username')?.value;
}

async function loginAs(page, user: { username: string; password: string }) {
  const lp = new LoginPage(page);
  await lp.goto();
  await lp.login(user.username, user.password);
  await new InventoryPage(page).expectPageLoaded();
}

// ─── Session lifecycle ────────────────────────────────────────────────────────

test.describe('Session cookie lifecycle', { tag: ['@health', '@regression'] }, () => {
  test('session cookie is present after login', async ({ page }) => {
    await test.step('Login', () => loginAs(page, users.standard));

    await test.step('Session cookie is present', async () => {
      const sessionUsername = await getSessionUsernameCookie(page);
      expect(sessionUsername, 'No session-username cookie found after login').toBeDefined();
    });
  });

  test('session cookie value contains the logged-in username', async ({ page }) => {
    await test.step('Login as standard_user', () => loginAs(page, users.standard));

    await test.step('Session cookie includes username', async () => {
      const sessionUsername = await getSessionUsernameCookie(page);
      expect(sessionUsername).toBe(users.standard.username);
    });
  });

  test('session cookie is removed after logout', async ({ page }) => {
    await test.step('Login then logout', async () => {
      await loginAs(page, users.standard);
      await new InventoryPage(page).logout();
    });

    await test.step('Session cookie no longer exists', async () => {
      const sessionUsername = await getSessionUsernameCookie(page);
      expect(sessionUsername, 'session-username cookie still present after logout').toBeUndefined();
    });
  });
});

// ─── Security — no sensitive data in storage ──────────────────────────────────

test.describe('No sensitive data in localStorage', { tag: ['@health', '@regression'] }, () => {
  test('password is not stored in localStorage after login', async ({ page }) => {
    await test.step('Login', () => loginAs(page, users.standard));

    await test.step('No storage value contains the password', async () => {
      const storage = await getStorage(page);
      for (const [key, value] of Object.entries(storage)) {
        expect(
          value,
          `Password found in localStorage key "${key}"`,
        ).not.toContain(users.standard.password);
      }
    });
  });

  test('no credit card or payment data appears in localStorage', async ({ page }) => {
    await test.step('Complete full checkout', async () => {
      await loginAs(page, users.standard);
      const inv = new InventoryPage(page);
      await inv.addItemToCartByName('Sauce Labs Backpack');
      await page.goto('https://www.saucedemo.com/cart.html');
      await page.locator('[data-test="checkout"]').click();
      await page.locator('[data-test="firstName"]').fill('Jane');
      await page.locator('[data-test="lastName"]').fill('Doe');
      await page.locator('[data-test="postalCode"]').fill('10001');
      await page.locator('[data-test="continue"]').click();
      await page.locator('[data-test="finish"]').click();
    });

    await test.step('No payment-related strings in storage', async () => {
      const storage = await getStorage(page);
      const allValues = Object.values(storage).join(' ');
      const sensitivePatterns = [/\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}/, /cvv/i, /card/i];
      for (const pattern of sensitivePatterns) {
        expect(allValues).not.toMatch(pattern);
      }
    });
  });
});

// ─── Cart key lifecycle ───────────────────────────────────────────────────────

test.describe('Cart storage lifecycle', { tag: ['@health', '@regression'] }, () => {
  test('cart key appears in localStorage after adding an item', async ({ page }) => {
    await test.step('Add an item to cart', async () => {
      await loginAs(page, users.standard);
      await new InventoryPage(page).addItemToCartByName('Sauce Labs Backpack');
    });

    await test.step('A cart-related key is present', async () => {
      const storage = await getStorage(page);
      const cartKey = Object.keys(storage).find((k) => k.toLowerCase().includes('cart'));
      expect(cartKey, 'No cart key found in localStorage after adding item').toBeDefined();
    });
  });

  test('cart storage value is valid JSON', async ({ page }) => {
    await test.step('Add items', async () => {
      await loginAs(page, users.standard);
      await new InventoryPage(page).addItemToCartByName('Sauce Labs Backpack');
    });

    await test.step('Cart storage value parses as JSON without throwing', async () => {
      const storage = await getStorage(page);
      const cartEntry = Object.entries(storage).find(([k]) => k.toLowerCase().includes('cart'));
      expect(cartEntry).toBeDefined();
      expect(() => JSON.parse(cartEntry![1])).not.toThrow();
    });
  });

  test('cart key is cleared after Reset App State', async ({ page }) => {
    await test.step('Add item then reset', async () => {
      await loginAs(page, users.standard);
      const inv = new InventoryPage(page);
      await inv.addItemToCartByName('Sauce Labs Backpack');
      await inv.resetAppState();
    });

    await test.step('Cart storage is empty or absent', async () => {
      const storage = await getStorage(page);
      const cartEntry = Object.entries(storage).find(([k]) => k.toLowerCase().includes('cart'));
      // Either no cart key, or it contains an empty collection
      if (cartEntry) {
        const value = JSON.parse(cartEntry[1]);
        const isEmpty =
          value === null ||
          (Array.isArray(value) && value.length === 0) ||
          (typeof value === 'object' && Object.keys(value).length === 0);
        expect(isEmpty, `Cart key "${cartEntry[0]}" is not empty after reset: ${cartEntry[1]}`).toBe(true);
      }
    });
  });
});

// ─── Session isolation between users ─────────────────────────────────────────

test.describe('Session transitions', { tag: ['@health', '@regression'] }, () => {
  test('logging in as a different user overwrites the session cookie', async ({ page }) => {
    await test.step('Login as standard_user', () => loginAs(page, users.standard));

    let firstSession: string | undefined;
    await test.step('Read session cookie value', async () => {
      firstSession = await getSessionUsernameCookie(page);
      expect(firstSession).toBe(users.standard.username);
    });

    await test.step('Logout and login as error_user', async () => {
      await new InventoryPage(page).logout();
      await loginAs(page, users.error);
    });

    await test.step('Session cookie now contains error_user username', async () => {
      const sessionUsername = await getSessionUsernameCookie(page);
      expect(sessionUsername).toBe(users.error.username);
      expect(sessionUsername).not.toBe(firstSession);
    });
  });

  test('cart storage persists when switching users in the same browser context', async ({ page }) => {
    await test.step('standard_user adds items', async () => {
      await loginAs(page, users.standard);
      await new InventoryPage(page).addItemToCartByName('Sauce Labs Backpack');
      await new InventoryPage(page).expectCartCount(1);
    });

    await test.step('Logout and login as error_user', async () => {
      await new InventoryPage(page).logout();
      await loginAs(page, users.error);
    });

    await test.step('error_user sees the same local cart storage', async () => {
      await new InventoryPage(page).expectCartCount(1);
    });
  });
});
