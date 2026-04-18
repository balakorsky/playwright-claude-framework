# Test Coverage Matrix

Maps every feature area to the test files and tags that cover it.

**Projects:** `api` · `chromium / firefox / webkit` (auth UI) · `e2e` · `visual` · `a11y`  
**Tags:** `@smoke` · `@regression` · `@e2e` · `@api` · `@visual` · `@a11y`

---

## Authentication

| Scenario | File | Tags | Project |
|---|---|---|---|
| Successful login (standard, locked, empty fields) | `tests/auth/login-positive.spec.ts` | `@smoke` | chromium / firefox / webkit |
| Wrong credentials, locked_out_user error message | `tests/auth/login-negative.spec.ts` | `@regression` | chromium / firefox / webkit |
| Empty / partial form validation | `tests/auth/login-validation.spec.ts` | `@regression` | chromium / firefox / webkit |
| Edge cases (spaces, case sensitivity, tab order) | `tests/auth/login-edge.spec.ts` | `@regression` | chromium / firefox / webkit |
| UI element presence and labels | `tests/auth/login-ui.spec.ts` | `@regression` | chromium / firefox / webkit |
| Login API (POST /login, tokens, 4xx) | `tests/api/login.api.spec.ts` | `@api @smoke @regression` | api |
| locked_out_user dismissible error, direct-URL bypass | `tests/e2e/login-failure.spec.ts` | `@regression` | e2e |
| All special users land on inventory | `tests/e2e/login-failure.spec.ts` | `@regression` | e2e |
| performance_glitch_user completes within 10 s | `tests/e2e/login-failure.spec.ts` | `@regression` | e2e |
| Login page visual regression | `tests/visual/visual-regression.spec.ts` | `@visual` | visual |
| Login page accessibility (WCAG 2.1 AA) | `tests/a11y/login-a11y.spec.ts` | `@a11y` | a11y |

---

## Product Catalog (Inventory)

| Scenario | File | Tags | Project |
|---|---|---|---|
| Exactly 6 products displayed | `tests/e2e/product-integrity.spec.ts` | `@regression` | e2e |
| All products have name, positive price, image | `tests/e2e/product-integrity.spec.ts` | `@regression` | e2e |
| No duplicate product names | `tests/e2e/product-integrity.spec.ts` | `@regression` | e2e |
| Default sort is A-Z | `tests/e2e/product-integrity.spec.ts` | `@regression` | e2e |
| Sort Z-A, price lo-hi, price hi-lo | `tests/e2e/inventory-interaction.spec.ts` | `@regression` | e2e |
| Sort does not reset cart badge | `tests/e2e/inventory-interaction.spec.ts` | `@regression` | e2e |
| Sort order resets to A-Z on detail page return | `tests/e2e/inventory-interaction.spec.ts` | `@regression` | e2e |
| Reset App State reverts Remove → Add to Cart | `tests/e2e/inventory-interaction.spec.ts` | `@regression` | e2e |
| Reset App State resets sort dropdown | `tests/e2e/inventory-interaction.spec.ts` | `@regression` | e2e |
| problem_user images all same (known bug) | `tests/e2e/inventory-cart-failure.spec.ts` | `@regression` | e2e |
| problem_user sort broken (test.fail — known bug) | `tests/e2e/inventory-cart-failure.spec.ts` | `@regression` | e2e |
| Inventory visual regression (standard + visual_user) | `tests/visual/visual-regression.spec.ts` | `@visual` | visual |
| Inventory accessibility | `tests/a11y/login-a11y.spec.ts` | `@a11y` | a11y |

---

## Product Detail Page

| Scenario | File | Tags | Project |
|---|---|---|---|
| Open detail page from inventory | `tests/e2e/item-details.spec.ts` | `@regression` | e2e |
| Name / price / description match inventory | `tests/e2e/item-details.spec.ts` | `@regression` | e2e |
| Add to Cart / Remove on detail page | `tests/e2e/item-details.spec.ts` | `@regression` | e2e |
| Badge syncs between detail and inventory | `tests/e2e/item-details.spec.ts` | `@regression` | e2e |
| Back to Products returns to inventory URL | `tests/e2e/item-details.spec.ts` | `@regression` | e2e |
| Detail page opens correctly after sort | `tests/e2e/inventory-interaction.spec.ts` | `@regression` | e2e |
| Direct URL to detail without login → redirect | `tests/e2e/deep-link-protection.spec.ts` | `@regression` | e2e |

---

## Cart Management

| Scenario | File | Tags | Project |
|---|---|---|---|
| Add / remove single items from inventory | `tests/e2e/cross-page-state.spec.ts` | `@regression` | e2e |
| Badge count = cart row count | `tests/e2e/cross-page-state.spec.ts` | `@regression` | e2e |
| Item added on inventory appears in cart | `tests/e2e/cross-page-state.spec.ts` | `@regression` | e2e |
| Item added on detail appears in cart | `tests/e2e/cross-page-state.spec.ts` | `@regression` | e2e |
| Remove on cart page → badge clears on inventory | `tests/e2e/cross-page-state.spec.ts` | `@regression` | e2e |
| Remove on cart → inventory button reverts | `tests/e2e/cross-page-state.spec.ts` | `@regression` | e2e |
| Cart state survives navigation and reload | `tests/e2e/cross-page-state.spec.ts` | `@regression` | e2e |
| After Reset App State: badge + cart + detail badge = 0 | `tests/e2e/cross-page-state.spec.ts` | `@regression` | e2e |
| After checkout: detail page shows Add to Cart | `tests/e2e/cross-page-state.spec.ts` | `@regression` | e2e |
| Add all 6 items (badge = 6, cart = 6 rows) | `tests/e2e/bulk-cart.spec.ts` | `@regression` | e2e |
| Remove all 6 from inventory / from cart page | `tests/e2e/bulk-cart.spec.ts` | `@regression` | e2e |
| Add/remove cycles — badge always equals cart rows | `tests/e2e/bulk-cart.spec.ts` | `@regression` | e2e |
| Cart contents unchanged by sort order | `tests/e2e/bulk-cart.spec.ts` | `@regression` | e2e |
| problem_user Add to Cart adds wrong item (test.fail) | `tests/e2e/inventory-cart-failure.spec.ts` | `@regression` | e2e |
| error_user remove from cart fails (test.fail) | `tests/e2e/inventory-cart-failure.spec.ts` | `@regression` | e2e |
| Price in cart matches price on inventory | `tests/e2e/product-integrity.spec.ts` | `@regression` | e2e |

---

## Checkout

| Scenario | File | Tags | Project |
|---|---|---|---|
| Happy path — add item → checkout → complete | `tests/e2e/checkout.spec.ts` | `@smoke @e2e` | e2e |
| Empty form / missing fields validation | `tests/e2e/checkout-validation.spec.ts` | `@regression` | e2e |
| Cancel returns to cart with item intact | `tests/e2e/checkout-validation.spec.ts` | `@regression` | e2e |
| Valid data proceeds to step two | `tests/e2e/checkout-validation.spec.ts` | `@smoke` | e2e |
| Empty cart shows empty summary on step two | `tests/e2e/checkout-guards.spec.ts` | `@regression` | e2e |
| After Reset App State — step two is empty | `tests/e2e/checkout-guards.spec.ts` | `@regression` | e2e |
| Cancel clears fields, refresh clears fields | `tests/e2e/checkout-form-persistence.spec.ts` | `@regression` | e2e |
| Error updates per field on resubmit | `tests/e2e/checkout-form-persistence.spec.ts` | `@regression` | e2e |
| Finish → complete page, success header, body text | `tests/e2e/checkout-completion.spec.ts` | `@regression` | e2e |
| Cart badge cleared after order completion | `tests/e2e/checkout-completion.spec.ts` | `@regression` | e2e |
| Back Home → inventory | `tests/e2e/checkout-completion.spec.ts` | `@regression` | e2e |
| Single item subtotal = inventory price | `tests/e2e/product-integrity.spec.ts` | `@regression` | e2e |
| Multi-item subtotal = sum of cart prices | `tests/e2e/product-integrity.spec.ts` | `@regression` | e2e |
| Total = subtotal + tax | `tests/e2e/product-integrity.spec.ts` | `@regression` | e2e |
| problem_user last name field broken (test.fail) | `tests/e2e/checkout-failure.spec.ts` | `@regression` | e2e |
| Whitespace-only first name rejected | `tests/e2e/checkout-failure.spec.ts` | `@regression` | e2e |
| XSS string not executed | `tests/e2e/checkout-failure.spec.ts` | `@regression` | e2e |
| 500-char name does not crash | `tests/e2e/checkout-failure.spec.ts` | `@regression` | e2e |
| Non-numeric postal code accepted (no format validation) | `tests/e2e/checkout-failure.spec.ts` | `@regression` | e2e |

---

## Route Protection & Session

| Scenario | File | Tags | Project |
|---|---|---|---|
| /inventory, /cart without login → redirect | `tests/e2e/session.spec.ts` | `@regression` | e2e |
| /inventory-item, /checkout-*, /cart without login → redirect | `tests/e2e/deep-link-protection.spec.ts` | `@regression` | e2e |
| After logout — direct URL to cart / details / checkout → redirect | `tests/e2e/session.spec.ts`, `tests/e2e/deep-link-protection.spec.ts` | `@regression` | e2e |
| Browser back after logout does not restore session | `tests/e2e/session.spec.ts` | `@regression` | e2e |
| Cart is empty after logout + re-login | `tests/e2e/session.spec.ts` | `@regression` | e2e |
| Authenticated direct URL to step two → empty summary (quirk documented) | `tests/e2e/deep-link-protection.spec.ts` | `@regression` | e2e |
| Authenticated direct URL to complete → loads (no hard guard, documented) | `tests/e2e/deep-link-protection.spec.ts` | `@regression` | e2e |

---

## Navigation & Menu

| Scenario | File | Tags | Project |
|---|---|---|---|
| All Items link → inventory | `tests/e2e/navigation-integrity.spec.ts` | `@regression` | e2e |
| About link → saucelabs.com | `tests/e2e/navigation-integrity.spec.ts` | `@regression` | e2e |
| Burger menu open/close — all links visible | `tests/e2e/navigation-integrity.spec.ts` | `@regression` | e2e |
| Footer Twitter / Facebook / LinkedIn hrefs correct | `tests/e2e/navigation-integrity.spec.ts` | `@regression` | e2e |
| Back to Products, All Items, menu open/close don't clear cart | `tests/e2e/navigation-integrity.spec.ts` | `@regression` | e2e |

---

## Failure Scenarios (Special Users)

| Scenario | File | Tags | Project |
|---|---|---|---|
| locked_out_user: error, dismiss, direct URL still blocked | `tests/e2e/login-failure.spec.ts` | `@regression` | e2e |
| problem_user: wrong images (known bug documented) | `tests/e2e/inventory-cart-failure.spec.ts` | `@regression` | e2e |
| problem_user: sort broken, Add to Cart cross-mapped (test.fail) | `tests/e2e/inventory-cart-failure.spec.ts` | `@regression` | e2e |
| problem_user: last name field non-functional (test.fail) | `tests/e2e/checkout-failure.spec.ts` | `@regression` | e2e |
| error_user: remove from cart fails, sort broken (test.fail) | `tests/e2e/inventory-cart-failure.spec.ts` | `@regression` | e2e |
| performance_glitch_user: login within 10 s | `tests/e2e/login-failure.spec.ts` | `@regression` | e2e |

---

## Network Interception & localStorage

| Scenario | File | Tags | Project |
|---|---|---|---|
| Images aborted → inventory and cart fully functional | `tests/e2e/network-mocking.spec.ts` | `@regression` | e2e |
| Images 404 → no crash, 6 products visible | `tests/e2e/network-mocking.spec.ts` | `@regression` | e2e |
| CSS aborted → login form still functional | `tests/e2e/network-mocking.spec.ts` | `@regression` | e2e |
| Images delayed 2 s → app functional | `tests/e2e/network-mocking.spec.ts` | `@regression` | e2e |
| localStorage.clear() mid-session → redirect to login | `tests/e2e/network-mocking.spec.ts` | `@regression` | e2e |
| Corrupt cart data → no crash on reload | `tests/e2e/network-mocking.spec.ts` | `@regression` | e2e |
| Clear localStorage + re-login → empty cart | `tests/e2e/network-mocking.spec.ts` | `@regression` | e2e |

---

## Observability

| Scenario | File | Tags | Project |
|---|---|---|---|
| Login, add to cart, checkout, sort, logout — zero console errors | `tests/e2e/observability.spec.ts` | `@regression` | e2e |
| Full session — zero failed saucedemo.com requests | `tests/e2e/observability.spec.ts` | `@regression` | e2e |
| problem_user / error_user console errors documented | `tests/e2e/observability.spec.ts` | `@regression` | e2e |

---

## API Layer (reqres.in)

| Scenario | File | Tags | Project |
|---|---|---|---|
| GET /users — list, pagination, schema | `tests/api/users.api.spec.ts` | `@api @smoke @regression` | api |
| GET /users/:id — found, not found, schema | `tests/api/users.api.spec.ts` | `@api @smoke @regression` | api |
| POST /users — create, response fields | `tests/api/users.api.spec.ts` | `@api @regression` | api |
| PUT /users/:id — update, timestamp | `tests/api/users.api.spec.ts` | `@api @regression` | api |
| DELETE /users/:id — 204 response | `tests/api/users.api.spec.ts` | `@api @regression` | api |
| POST /login — success token, missing password, 400 | `tests/api/login.api.spec.ts` | `@api @smoke @regression` | api |

---

## Visual Regression

| Scenario | File | Tags | Project |
|---|---|---|---|
| Login page baseline (standard_user) | `tests/visual/visual-regression.spec.ts` | `@visual` | visual |
| Inventory page baseline (standard_user) | `tests/visual/visual-regression.spec.ts` | `@visual` | visual |
| Cart page baseline | `tests/visual/visual-regression.spec.ts` | `@visual` | visual |
| Checkout step one baseline | `tests/visual/visual-regression.spec.ts` | `@visual` | visual |
| Inventory baseline (visual_user — known broken state) | `tests/visual/visual-regression.spec.ts` | `@visual` | visual |

---

## Accessibility

| Scenario | File | Tags | Project |
|---|---|---|---|
| Login page — WCAG 2.1 AA (axe-core) | `tests/a11y/login-a11y.spec.ts` | `@a11y` | a11y |
| Inventory page — critical/serious violations only | `tests/a11y/login-a11y.spec.ts` | `@a11y` | a11y |
| Checkout step one — critical/serious violations | `tests/a11y/login-a11y.spec.ts` | `@a11y` | a11y |

---

## Coverage Summary

| Area | Smoke | Regression | API | Visual | A11y |
|---|---|---|---|---|---|
| Authentication | ✅ | ✅ | ✅ | ✅ | ✅ |
| Product Catalog | — | ✅ | — | ✅ | ✅ |
| Product Detail | — | ✅ | — | — | — |
| Cart | — | ✅ | — | ✅ | — |
| Checkout | ✅ | ✅ | — | ✅ | ✅ |
| Route Protection | — | ✅ | — | — | — |
| Navigation | — | ✅ | — | — | — |
| Failure Scenarios | — | ✅ | — | ✅ | — |
| Network / localStorage | — | ✅ | — | — | — |
| Observability | — | ✅ | — | — | — |
| API Layer | ✅ | ✅ | ✅ | — | — |
