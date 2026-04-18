/**
 * Checkout step-one form persistence and validation tests.
 *
 * Verifies that:
 *  - cancel clears the form and returns to cart
 *  - refreshing step one clears the form
 *  - fixing one field after a validation error moves the error to the remaining empty field
 *  - the error message disappears once all required fields are filled
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { users } from '../../test-data/users';

async function reachStepOne(page) {
  const loginPage = new LoginPage(page);
  const inventory = new InventoryPage(page);
  const cart = new CartPage(page);

  await loginPage.goto();
  await loginPage.login(users.standard.username, users.standard.password);
  await inventory.addItemToCartByName('Sauce Labs Backpack');
  await cart.goto();
  await cart.proceedToCheckout();
}

test.describe('Checkout form persistence', { tag: ['@e2e', '@regression'] }, () => {
  test('cancel from step one returns to cart and discards input', async ({ page }) => {
    const checkout = new CheckoutPage(page);

    await test.step('Reach step one and type data', async () => {
      await reachStepOne(page);
      await checkout.firstNameInput.fill('Jane');
      await checkout.lastNameInput.fill('Doe');
    });

    await test.step('Cancel navigates back to cart', async () => {
      await checkout.cancel();
    });

    await test.step('Re-enter step one and assert fields are empty', async () => {
      const cart = new CartPage(page);
      await cart.proceedToCheckout();
      const values = await checkout.getFieldValues();
      expect(values.firstName).toBe('');
      expect(values.lastName).toBe('');
      expect(values.postalCode).toBe('');
    });
  });

  test('refreshing step one clears form fields', async ({ page }) => {
    const checkout = new CheckoutPage(page);

    await test.step('Reach step one and type data', async () => {
      await reachStepOne(page);
      await checkout.firstNameInput.fill('Jane');
      await checkout.lastNameInput.fill('Doe');
      await checkout.postalCodeInput.fill('10001');
    });

    await test.step('Reload the page', async () => {
      await page.reload();
    });

    await test.step('Fields are cleared after reload', async () => {
      const values = await checkout.getFieldValues();
      expect(values.firstName).toBe('');
      expect(values.lastName).toBe('');
      expect(values.postalCode).toBe('');
    });
  });

  test('submitting empty form shows validation error', async ({ page }) => {
    const checkout = new CheckoutPage(page);

    await test.step('Reach step one', () => reachStepOne(page));

    await test.step('Submit without filling anything', async () => {
      await checkout.continueButton.click();
    });

    await test.step('Validation error is shown', async () => {
      await checkout.expectError('First Name is required');
      await checkout.expectStaysOnStepOne();
    });
  });

  test('fixing the errored field moves error to the next missing field', async ({ page }) => {
    const checkout = new CheckoutPage(page);

    await test.step('Reach step one and submit empty', async () => {
      await reachStepOne(page);
      await checkout.continueButton.click();
      await checkout.expectError('First Name is required');
    });

    await test.step('Fill first name and resubmit', async () => {
      await checkout.firstNameInput.fill('Jane');
      await checkout.continueButton.click();
    });

    await test.step('Error now points to last name', async () => {
      await checkout.expectError('Last Name is required');
      await checkout.expectStaysOnStepOne();
    });
  });

  test('error message disappears when all fields are filled correctly', async ({ page }) => {
    const checkout = new CheckoutPage(page);

    await test.step('Reach step one and trigger error', async () => {
      await reachStepOne(page);
      await checkout.continueButton.click();
      await checkout.expectError('First Name is required');
    });

    await test.step('Fill all fields and resubmit', async () => {
      await checkout.firstNameInput.fill('Jane');
      await checkout.lastNameInput.fill('Doe');
      await checkout.postalCodeInput.fill('10001');
      await checkout.continueButton.click();
    });

    await test.step('No error message on step two', async () => {
      await checkout.expectOnStepTwo();
      await checkout.expectErrorNotVisible();
    });
  });
});
