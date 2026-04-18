# Playwright Test Automation Framework

A portfolio-grade test automation framework built with **Playwright + TypeScript**, covering a SauceDemo e-commerce application across six quality dimensions: functional UI, API contract, end-to-end business flows, visual regression, accessibility, and observability.

---

## Quick Start

```bash
# Install dependencies
npm ci

# Run a specific project
npx playwright test --project=e2e
npx playwright test --project=api
npx playwright test --project=chromium   # also: firefox, webkit
npx playwright test --project=visual
npx playwright test --project=a11y

# Run by tag
npx playwright test --grep "@smoke"
npx playwright test --grep "@regression"
npx playwright test --grep "@e2e"
npx playwright test --grep "@api"

# Run a single file
npx playwright test tests/e2e/checkout.spec.ts

# Run against a specific environment (default: dev)
TEST_ENV=staging npx playwright test --project=api

# Update visual baselines after intentional UI changes (macOS)
npx playwright test --project=visual --update-snapshots

# Quality gate check (fails if pass rate < 80%)
node scripts/quality-gate.mjs results.json 0.8
```

---

## Project Structure

```
.
├── api/
│   ├── clients/
│   │   ├── baseClient.ts          # Abstract: get/post/put/delete + defaultHeaders()
│   │   └── reqresClient.ts        # Business methods, extends BaseApiClient
│   ├── fixtures/
│   │   └── apiFixtures.ts         # Playwright fixture: { reqresClient }
│   ├── helpers/
│   │   └── apiAssertions.ts       # assertApiSuccess / assertStatus / assertSchema
│   ├── models/
│   │   └── reqres.models.ts       # TypeScript interfaces
│   └── schemas/
│       └── reqres.schemas.ts      # Zod validation schemas
├── config/
│   └── env.ts                     # TEST_ENV → base URL; throws on unknown values
├── fixtures/
│   ├── loginFixture.ts            # UI fixtures: loginPage, inventoryPage
│   └── observabilityFixture.ts    # Console error + failed request tracking
├── pages/
│   ├── LoginPage.ts
│   ├── InventoryPage.ts
│   ├── CartPage.ts
│   ├── CheckoutPage.ts
│   └── ProductDetailPage.ts
├── scripts/
│   └── quality-gate.mjs           # CI quality gate: fail if pass rate < threshold
├── test-data/
│   └── users.ts                   # SauceDemo credentials + error message strings
├── tests/
│   ├── api/                       # reqres.in API contract tests
│   ├── auth/                      # Login UI tests (chromium / firefox / webkit)
│   ├── e2e/                       # Business flow tests (18 spec files)
│   ├── visual/                    # Screenshot regression baselines
│   └── a11y/                      # Accessibility smoke tests
├── docs/
│   └── coverage-matrix.md         # Feature → test file → tag mapping
├── .github/workflows/
│   ├── playwright.yml             # Main CI: 5 parallel jobs + quality gates
│   └── update-snapshots.yml       # Manual: regenerate Linux visual baselines
└── playwright.config.ts
```

---

## Test Projects

| Project | Test Dir | Browser | What It Covers |
|---|---|---|---|
| `api` | `tests/api/` | none | reqres.in REST API — contract, schema, status codes |
| `chromium` | `tests/auth/` | Chrome | Login UI on Chrome |
| `firefox` | `tests/auth/` | Firefox | Login UI on Firefox |
| `webkit` | `tests/auth/` | Safari | Login UI on Safari |
| `e2e` | `tests/e2e/` | Chrome | Full business flows — 18 spec files, ~120 tests |
| `visual` | `tests/visual/` | Chrome | Screenshot regression (platform-specific baselines) |
| `a11y` | `tests/a11y/` | Chrome | WCAG 2.1 AA via axe-core |

---

## E2E Test Files

| File | Area |
|---|---|
| `checkout.spec.ts` | Happy path end-to-end flow |
| `session.spec.ts` | Auth session, logout, cart persistence |
| `checkout-validation.spec.ts` | Required field validation |
| `checkout-guards.spec.ts` | Unauthenticated / empty cart route guards |
| `checkout-completion.spec.ts` | Complete page integrity |
| `checkout-form-persistence.spec.ts` | Cancel, refresh, error update behaviour |
| `product-integrity.spec.ts` | Catalog count, prices, checkout math |
| `item-details.spec.ts` | Detail page content, add/remove, badge sync |
| `cross-page-state.spec.ts` | Badge ↔ cart consistency across every page |
| `bulk-cart.spec.ts` | All 6 items add/remove, sort independence |
| `navigation-integrity.spec.ts` | Burger menu, footer links, cart state |
| `deep-link-protection.spec.ts` | Direct URL access — auth and post-logout |
| `inventory-interaction.spec.ts` | Sort + cart interaction, Reset App State |
| `login-failure.spec.ts` | Special user login behavior and timing |
| `inventory-cart-failure.spec.ts` | `problem_user` and `error_user` known bugs |
| `checkout-failure.spec.ts` | `problem_user` checkout + form edge cases |
| `network-mocking.spec.ts` | Route interception, localStorage manipulation |
| `observability.spec.ts` | Console errors and failed requests monitoring |

---

## Architecture Decisions

### Page Object Model
Locators live in `pages/` classes; test files contain only flow logic. Changes to a selector require editing one file, not hunting through dozens of tests.

### Custom Fixtures
`loginFixture.ts` and `observabilityFixture.ts` use Playwright's `test.extend<T>()` to inject ready-to-use objects. Tests declare dependencies, not setup steps. API tests require `import { test } from '../../api/fixtures/apiFixtures'` — using the wrong import silently loses the fixture.

### API Client Hierarchy
`BaseApiClient` holds transport logic; `ReqresClient` holds business methods. Tests never construct raw `request.get(...)` calls — all assertions go through typed, named methods.

### Zod Schema Validation
Every API response is validated with `assertSchema(ZodSchema, body)` before any field access. This catches API shape regressions immediately — a missing field throws with a clear Zod error, not a cryptic `undefined` access.

### `test.fail()` for Known Bugs
`problem_user` and `error_user` tests use Playwright's `test.fail()` to document expected broken behavior. The test passes (green) when the bug is present; it fails (red) if the bug is unexpectedly fixed. This turns known regressions into living documentation.

### URL Resolution (RFC 3986)
`baseURL` ends with a trailing slash: `https://reqres.in/api/`. Client paths never start with `/`. A leading slash would replace the entire base path per RFC 3986, causing 404s that are hard to debug.

### Platform-Specific Visual Baselines
`toHaveScreenshot()` filenames include the OS (`-darwin`, `-linux`). macOS baselines are committed locally; Linux baselines are generated via the **"Update Visual Snapshots"** GitHub Actions workflow (manual trigger) and committed back automatically.

### Quality Gate
`scripts/quality-gate.mjs` parses the Playwright JSON report and exits non-zero if the pass rate falls below 80%. Each CI job runs this after tests, ensuring flaky or broken suites don't silently slide through.

---

## CI/CD

Five parallel jobs in `.github/workflows/playwright.yml`:

| Job | Project | Trigger |
|---|---|---|
| `api` | `api` | push / PR |
| `ui` | `chromium`, `firefox`, `webkit` (matrix) | push / PR |
| `e2e` | `e2e` | push / PR |
| `visual` | `visual` | push / PR |
| `a11y` | `a11y` | push / PR |

Each job:
1. Installs dependencies (`npm ci` + Playwright browsers)
2. Runs its test project with JSON reporter
3. Runs the quality gate (`node scripts/quality-gate.mjs results.json 0.8`)
4. Uploads the HTML report as an artifact (retained 14 days)

Visual baselines for Linux are regenerated manually:
```
GitHub → Actions → Update Visual Snapshots → Run workflow → branch: main
```

---

## Adding New Tests

1. **New page** → add a class in `pages/`, follow existing locator conventions (`[data-test="..."]` preferred)
2. **New E2E flow** → add a spec in `tests/e2e/`, import `{ test, expect }` from `@playwright/test`
3. **New API endpoint** → add a method to `ReqresClient`, a Zod schema in `schemas/`, test in `tests/api/`
4. **New visual check** → add `toHaveScreenshot()` call, run `--update-snapshots` locally, then trigger the "Update Visual Snapshots" workflow for Linux
5. **Documenting a known bug** → use `test.fail()` with a comment explaining what breaks and which user account triggers it
6. **Tag** every `test.describe` with a suite-level tag (`@e2e`, `@api`, `@visual`, `@a11y`) and individual tests with `@smoke` or `@regression`

See [docs/coverage-matrix.md](docs/coverage-matrix.md) for the full feature-to-test mapping.
