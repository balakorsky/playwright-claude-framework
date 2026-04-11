/**
 * Visual regression tests using Playwright's toHaveScreenshot().
 *
 * FIRST RUN: snapshots don't exist yet → run once locally to create baselines:
 *   npx playwright test --project=visual --update-snapshots
 * Then commit the generated PNG files so CI can compare against them.
 *
 * UPDATE SNAPSHOTS: only when the UI intentionally changes:
 *   npx playwright test --project=visual --update-snapshots
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { users } from '../../test-data/users';

test.describe('Visual regression – login page', { tag: ['@visual', '@smoke'] }, () => {
  test('login page matches snapshot', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(page).toHaveScreenshot('login-page.png', { fullPage: true });
  });

  test('login page error state matches snapshot', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginButton.click(); // trigger empty-form error

    await expect(page).toHaveScreenshot('login-page-error.png', { fullPage: true });
  });
});

test.describe('Visual regression – inventory: standard_user', { tag: '@visual' }, () => {
  test('standard_user inventory matches snapshot', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
    await page.waitForURL(/inventory/);

    await expect(page).toHaveScreenshot('inventory-standard-user.png', { fullPage: true });
  });
});

/**
 * visual_user has intentional visual bugs on SauceDemo:
 *  - wrong product images (images are shuffled)
 *  - mismatched prices on some items
 *
 * Each test captures visual_user's current broken state.
 * A failure here means the broken UI changed further — investigate before updating snapshots.
 */
test.describe('Visual regression – inventory: visual_user', { tag: ['@visual', '@regression'] }, () => {
  test('visual_user inventory matches its own snapshot', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.visual.username, users.visual.password);
    await page.waitForURL(/inventory/);

    await expect(page).toHaveScreenshot('inventory-visual-user.png', { fullPage: true });
  });

  /**
   * Cross-user visual diff:
   * Captures visual_user's inventory as a Buffer and compares it pixel-by-pixel
   * against the stored standard_user baseline. Any difference proves the bug exists.
   * The test is expected to fail the pixel comparison — that is the assertion.
   */
  test('visual_user inventory differs from standard_user baseline', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.visual.username, users.visual.password);
    await page.waitForURL(/inventory/);

    const visualScreenshot = await page.screenshot({ fullPage: true });

    // Re-login as standard_user to get baseline screenshot
    await page.goto('https://www.saucedemo.com/');
    await loginPage.login(users.standard.username, users.standard.password);
    await page.waitForURL(/inventory/);
    const standardScreenshot = await page.screenshot({ fullPage: true });

    // The screenshots must NOT be identical — visual_user has known bugs
    expect(visualScreenshot).not.toEqual(standardScreenshot);
  });
});
