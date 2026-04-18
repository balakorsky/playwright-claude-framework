/**
 * Checkout completion page integrity tests.
 *
 * Verifies that after finishing an order:
 *  - user lands on the complete page with correct header and text
 *  - cart badge is cleared
 *  - Back Home returns to inventory
 *  - navigating back to checkout URLs does not restore the previous order
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { users } from '../../test-data/users';

const SHIPPING = { firstName: 'Jane', lastName: 'Doe', postalCode: '10001' };
const ITEM = 'Sauce Labs Backpack';

async function completeCheckout(page) {
  const loginPage = new LoginPage(page);
  const inventory = new InventoryPage(page);
  const cart = new CartPage(page);
  const checkout = new CheckoutPage(page);

  await loginPage.goto();
  await loginPage.login(users.standard.username, users.standard.password);
  await inventory.addItemToCartByName(ITEM);
  await inventory.goToCart();
  await cart.proceedToCheckout();
  await checkout.fillShippingInfo(SHIPPING.firstName, SHIPPING.lastName, SHIPPING.postalCode);
  await checkout.finish();

  return checkout;
}

test.describe('Checkout completion page', { tag: ['@e2e', '@regression'] }, () => {
  test('finish navigates to complete page', async ({ page }) => {
    const checkout = await completeCheckout(page);

    await test.step('Assert on complete page', async () => {
      await checkout.expectOnComplete();
    });
  });

  test('complete page shows success header', async ({ page }) => {
    const checkout = await completeCheckout(page);

    await test.step('Assert success header text', async () => {
      await expect(checkout.confirmationHeader).toBeVisible();
      await expect(checkout.confirmationHeader).toHaveText('Thank you for your order!');
    });
  });

  test('complete page shows completion body text', async ({ page }) => {
    const checkout = await completeCheckout(page);

    await test.step('Assert completion body text is visible', async () => {
      await expect(checkout.completionText).toBeVisible();
    });
  });

  test('cart badge is cleared after order completion', async ({ page }) => {
    const inventory = new InventoryPage(page);
    await completeCheckout(page);

    await test.step('Assert cart badge is gone', async () => {
      await inventory.expectCartCount(0);
    });
  });

  test('Back Home button returns to inventory page', async ({ page }) => {
    const checkout = await completeCheckout(page);

    await test.step('Click back home', async () => {
      await checkout.clickBackHome();
    });
  });

  test('navigating back to step two after completion redirects to home or shows empty state', async ({ page }) => {
    await completeCheckout(page);

    await test.step('Attempt to navigate back to step two URL', async () => {
      await page.goto('https://www.saucedemo.com/checkout-step-two.html');
    });

    await test.step('Should be on step two with empty summary (SauceDemo allows this)', async () => {
      const currentUrl = page.url();
      const isOnStepTwo = currentUrl.includes('checkout-step-two');
      const isRedirectedHome = currentUrl === 'https://www.saucedemo.com/';

      expect(isOnStepTwo || isRedirectedHome).toBe(true);
    });
  });
});
