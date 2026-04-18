# Page Object Rules

## Locators belong in page objects only

Never write `page.locator(...)`, `page.getByRole(...)`, or `page.getByText(...)` directly inside a test file.
All selectors live in the corresponding page object class in `pages/`.

```ts
// ✗ Wrong — selector in test file
test('example', async ({ page }) => {
  await page.locator('#login-button').click();
});

// ✓ Correct — action in page object, called from test
test('example', async ({ loginPage }) => {
  await loginPage.loginButton.click();
});
```

## Prefer data-test attributes

Use `[data-test="..."]` selectors when SauceDemo provides them — they are stable across refactors.
Fall back to `#id` for elements without `data-test`. Avoid `.class` selectors.

```ts
// ✓ Stable
this.checkoutButton = page.locator('[data-test="checkout"]');
this.usernameInput  = page.locator('#user-name');

// ✗ Fragile
this.checkoutButton = page.locator('.btn_action');
```

## Assertions belong in page objects

Reusable assertions (`expectPageLoaded`, `expectErrorVisible`, etc.) go in the page object.
One-off test-specific assertions (exact value checks) can stay in the test.

```ts
// In page object — reusable
async expectPageLoaded() {
  await expect(this.page).toHaveURL(/inventory/);
  await expect(this.inventoryList).toBeVisible();
}

// In test — specific to this case
expect(prices[0]).toBeLessThan(prices[1]);
```

## One page object per page

Do not combine multiple pages into one class.
Current page objects: `LoginPage`, `InventoryPage`, `CartPage`, `CheckoutPage`.
Add a new file in `pages/` when a new page is needed.
