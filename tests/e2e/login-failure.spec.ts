/**
 * Login behavior under failure conditions.
 *
 * Covers:
 *  - locked_out_user: correct error message, error is dismissible, direct URL still blocked
 *  - All non-standard special users can log in and land on inventory
 *  - performance_glitch_user: login completes within an extended but bounded timeout
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { users, errorMessages } from '../../test-data/users';

// ─── locked_out_user ─────────────────────────────────────────────────────────

test.describe('locked_out_user — login failure behavior', { tag: ['@e2e', '@regression'] }, () => {
  test('locked_out_user sees the correct error message', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step('Attempt login', async () => {
      await loginPage.goto();
      await loginPage.login(users.lockedOut.username, users.lockedOut.password);
    });

    await test.step('Error message contains locked-out text', async () => {
      await loginPage.expectErrorMessage(errorMessages.lockedOut);
    });
  });

  test('locked_out_user error message is dismissible', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step('Trigger lock-out error', async () => {
      await loginPage.goto();
      await loginPage.login(users.lockedOut.username, users.lockedOut.password);
      await loginPage.expectErrorVisible();
    });

    await test.step('Dismiss the error', async () => {
      await loginPage.dismissError();
    });

    await test.step('Error is no longer visible', async () => {
      await loginPage.expectErrorDismissed();
    });
  });

  test('locked_out_user cannot bypass block via direct URL after failed login', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step('Attempt login (fails)', async () => {
      await loginPage.goto();
      await loginPage.login(users.lockedOut.username, users.lockedOut.password);
      await loginPage.expectErrorVisible();
    });

    await test.step('Try direct URL to inventory', async () => {
      await page.goto('https://www.saucedemo.com/inventory.html');
    });

    await test.step('Still on login page', async () => {
      await expect(page).toHaveURL('https://www.saucedemo.com/');
      await expect(page.locator('#login-button')).toBeVisible();
    });
  });
});

// ─── Special users — login succeeds ──────────────────────────────────────────

test.describe('Special users — login succeeds and lands on inventory', { tag: ['@e2e', '@regression'] }, () => {
  for (const { key, label } of [
    { key: 'problem',          label: 'problem_user' },
    { key: 'error',            label: 'error_user' },
    { key: 'visual',           label: 'visual_user' },
    { key: 'performanceGlitch', label: 'performance_glitch_user' },
  ]) {
    test(`${label} can log in and sees inventory`, async ({ page }) => {
      const loginPage = new LoginPage(page);
      const inventory = new InventoryPage(page);
      const user = users[key as keyof typeof users];

      await test.step('Login', async () => {
        await loginPage.goto();
        await loginPage.login(user.username, user.password);
      });

      await test.step('Lands on inventory page', async () => {
        await inventory.expectPageLoaded();
      });
    });
  }
});

// ─── performance_glitch_user — timing ────────────────────────────────────────

test.describe('performance_glitch_user — login timing', { tag: ['@e2e', '@regression'] }, () => {
  test('performance_glitch_user login completes within 10 seconds', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventory = new InventoryPage(page);

    await test.step('Navigate to login', async () => {
      await loginPage.goto();
    });

    await test.step('Submit credentials', async () => {
      await loginPage.login(users.performanceGlitch.username, users.performanceGlitch.password);
    });

    await test.step('Inventory loads within 10 s', async () => {
      await loginPage.expectLoginSuccess(10_000);
      await inventory.expectPageLoaded();
    });
  });
});
