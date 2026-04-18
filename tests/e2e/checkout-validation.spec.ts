/**
 * Negative validation tests for checkout step one (shipping info form).
 *
 * Verifies that:
 *  - required field errors appear when fields are missing
 *  - the form blocks progression to step two on invalid input
 *  - cancel returns the user to the cart
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { users } from '../../test-data/users';

const validData = { firstName: 'Jane', lastName: 'Doe', postalCode: '10001' };

const validationCases = [
  {
    name: 'shows error when all fields are empty',
    tags: ['@smoke'],
    firstName: '',
    lastName: '',
    postalCode: '',
    expectedError: 'First Name is required',
  },
  {
    name: 'shows error when last name is missing',
    tags: ['@regression'],
    firstName: validData.firstName,
    lastName: '',
    postalCode: '',
    expectedError: 'Last Name is required',
  },
  {
    name: 'shows error when postal code is missing',
    tags: ['@regression'],
    firstName: validData.firstName,
    lastName: validData.lastName,
    postalCode: '',
    expectedError: 'Postal Code is required',
  },
];

async function goToCheckoutStepOne(page) {
  const loginPage = new LoginPage(page);
  const inventory = new InventoryPage(page);
  const cart = new CartPage(page);

  await loginPage.goto();
  await loginPage.login(users.standard.username, users.standard.password);
  await inventory.addItemToCartByName('Sauce Labs Backpack');
  await inventory.goToCart();
  await cart.proceedToCheckout();
}

test.describe('Checkout step one — field validation', { tag: '@e2e' }, () => {
  for (const c of validationCases) {
    test(c.name, { tag: c.tags }, async ({ page }) => {
      const checkout = new CheckoutPage(page);

      await test.step('Navigate to checkout step one', () => goToCheckoutStepOne(page));

      await test.step(`Submit with firstName="${c.firstName}" lastName="${c.lastName}" postalCode="${c.postalCode}"`, async () => {
        await checkout.submitShippingInfo(c.firstName, c.lastName, c.postalCode);
      });

      await test.step(`Assert error: "${c.expectedError}"`, async () => {
        await checkout.expectError(c.expectedError);
        await checkout.expectStaysOnStepOne();
      });
    });
  }
});

test.describe('Checkout step one — cancel', { tag: ['@e2e', '@regression'] }, () => {
  test('cancel button returns user to cart with item intact', async ({ page }) => {
    const checkout = new CheckoutPage(page);
    const cart = new CartPage(page);

    await test.step('Navigate to checkout step one', () => goToCheckoutStepOne(page));

    await test.step('Click cancel', async () => {
      await checkout.cancel();
    });

    await test.step('Assert back in cart with item still present', async () => {
      await cart.expectItemCount(1);
      await cart.expectItemInCart('Sauce Labs Backpack');
    });
  });
});

test.describe('Checkout step one — valid data passes', { tag: ['@e2e', '@smoke'] }, () => {
  test('valid shipping info proceeds to step two', async ({ page }) => {
    const checkout = new CheckoutPage(page);

    await test.step('Navigate to checkout step one', () => goToCheckoutStepOne(page));

    await test.step('Fill all required fields', async () => {
      await checkout.submitShippingInfo(
        validData.firstName,
        validData.lastName,
        validData.postalCode,
      );
    });

    await test.step('Assert navigated to step two', async () => {
      await expect(page).toHaveURL(/checkout-step-two/);
    });
  });
});
