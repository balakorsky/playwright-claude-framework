/**
 * Checkout behavior under failure conditions.
 *
 * problem_user has a broken last name field on checkout step one:
 *  - typing in the field produces no stored value
 *  - submitting always gets "Last Name is required"
 *
 * Form edge cases test the boundaries of the shipping info form:
 *  - whitespace-only input should not pass validation
 *  - XSS strings are rendered as text, not executed
 *  - very long strings are handled without a crash
 *  - non-numeric postal code is accepted (SauceDemo does not validate format)
 *
 * Tests marked test.fail() document known bugs in problem_user.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { users } from '../../test-data/users';

async function reachStepOne(page, user = users.standard) {
  const loginPage = new LoginPage(page);
  const inventory = new InventoryPage(page);
  const cart = new CartPage(page);

  await loginPage.goto();
  await loginPage.login(user.username, user.password);
  await inventory.addItemToCartByName('Sauce Labs Backpack');
  await cart.goto();
  await cart.proceedToCheckout();
}

// ─── problem_user — broken last name field ────────────────────────────────────

test.describe('problem_user — last name field is broken', { tag: ['@e2e', '@regression'] }, () => {
  test.fail('last name field does not retain typed value (known bug)', async ({ page }) => {
    // test.fail(): for problem_user the lastName input's onChange is broken.
    // Typing "Doe" leaves the field empty. Assertion that value === "Doe" will fail.
    const checkout = new CheckoutPage(page);

    await test.step('Reach step one as problem_user', () => reachStepOne(page, users.problem));

    await test.step('Type into last name field', async () => {
      await checkout.lastNameInput.fill('Doe');
    });

    await test.step('Field value is "Doe" (fails — field is broken, value stays empty)', async () => {
      const value = await checkout.lastNameInput.inputValue();
      expect(value).toBe('Doe');
    });
  });

  test('problem_user checkout step one fails with "Last Name is required" even when last name was typed', async ({ page }) => {
    const checkout = new CheckoutPage(page);

    await test.step('Reach step one as problem_user', () => reachStepOne(page, users.problem));

    await test.step('Fill first name and postal code; attempt last name', async () => {
      await checkout.firstNameInput.fill('Jane');
      await checkout.lastNameInput.fill('Doe');
      await checkout.postalCodeInput.fill('10001');
      await checkout.continueButton.click();
    });

    await test.step('"Last Name is required" error appears despite typing', async () => {
      await checkout.expectError('Last Name is required');
      await checkout.expectStaysOnStepOne();
    });
  });
});

// ─── Form edge cases ──────────────────────────────────────────────────────────

test.describe('Checkout form — edge cases', { tag: ['@e2e', '@regression'] }, () => {
  test('whitespace-only first name is rejected with a validation error', async ({ page }) => {
    const checkout = new CheckoutPage(page);

    await test.step('Reach step one', () => reachStepOne(page));

    await test.step('Submit with spaces-only first name', async () => {
      await checkout.submitShippingInfo('   ', 'Doe', '10001');
    });

    await test.step('Validation error shown, stays on step one', async () => {
      await checkout.expectError('First Name is required');
      await checkout.expectStaysOnStepOne();
    });
  });

  test('XSS string in first name is rendered as text — not executed', async ({ page }) => {
    const xss = '<script>window.__xss=1</script>';
    const checkout = new CheckoutPage(page);

    await test.step('Reach step one', () => reachStepOne(page));

    await test.step('Fill XSS string in first name', async () => {
      await checkout.submitShippingInfo(xss, 'Doe', '10001');
    });

    await test.step('Proceeds to step two (field accepted) and script was not executed', async () => {
      await checkout.expectOnStepTwo();
      const injected = await page.evaluate(() => (window as unknown as Record<string, unknown>).__xss);
      expect(injected).toBeUndefined();
    });
  });

  test('very long first name string (500 chars) does not crash the form', async ({ page }) => {
    const longName = 'A'.repeat(500);
    const checkout = new CheckoutPage(page);

    await test.step('Reach step one', () => reachStepOne(page));

    await test.step('Submit with 500-char first name', async () => {
      await checkout.submitShippingInfo(longName, 'Doe', '10001');
    });

    await test.step('Application handles it — either proceeds or shows an error (no crash)', async () => {
      const url = page.url();
      const isOnStepTwo = url.includes('checkout-step-two');
      const isOnStepOne = url.includes('checkout-step-one');
      expect(isOnStepTwo || isOnStepOne).toBe(true);
    });
  });

  test('non-numeric postal code is accepted (SauceDemo does not validate format)', async ({ page }) => {
    const checkout = new CheckoutPage(page);

    await test.step('Reach step one', () => reachStepOne(page));

    await test.step('Submit with alphabetic postal code', async () => {
      await checkout.submitShippingInfo('Jane', 'Doe', 'ABCDE');
    });

    await test.step('Proceeds to step two — postal code format is not validated', async () => {
      await checkout.expectOnStepTwo();
    });
  });

  test('numeric-only first name is accepted (no name format validation)', async ({ page }) => {
    const checkout = new CheckoutPage(page);

    await test.step('Reach step one', () => reachStepOne(page));

    await test.step('Submit with digits as first name', async () => {
      await checkout.submitShippingInfo('12345', 'Doe', '10001');
    });

    await test.step('Proceeds to step two', async () => {
      await checkout.expectOnStepTwo();
    });
  });

  test('special characters in name fields are accepted', async ({ page }) => {
    const checkout = new CheckoutPage(page);

    await test.step('Reach step one', () => reachStepOne(page));

    await test.step("Submit with hyphens and apostrophes (e.g. O'Brien-Smith)", async () => {
      await checkout.submitShippingInfo("O'Brien", 'Smith-Jones', '10001');
    });

    await test.step('Proceeds to step two', async () => {
      await checkout.expectOnStepTwo();
    });
  });
});
