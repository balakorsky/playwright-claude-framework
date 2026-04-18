# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This project is a structured Playwright + TypeScript test automation framework built to cover multiple quality layers of a web application.

It includes:

- UI functional tests
- API tests
- End-to-end business flow tests
- Visual regression tests
- Accessibility smoke tests
- CI quality gates
- Environment-based execution
- Data-driven test design
- Reusable fixtures, helpers, and page objects

The project is designed not only as a learning exercise, but also as a portfolio-style automation framework that follows scalable QA engineering practices.

---

## Tech Stack

- **Playwright** + **TypeScript**
- **Zod** — runtime API response schema validation
- **@axe-core/playwright** — accessibility checks
- **Playwright HTML / JSON reporters**
- **GitHub Actions** — CI with 5 parallel jobs + quality gate script

---

## Commands

```bash
# Run a specific test suite
npx playwright test --project=api
npx playwright test --project=chromium     # auth UI (also: firefox, webkit)
npx playwright test --project=e2e
npx playwright test --project=visual
npx playwright test --project=a11y

# Run a single test file
npx playwright test tests/api/users.api.spec.ts

# Run tests by tag
npx playwright test --grep "@smoke"
npx playwright test --grep "@regression"
npx playwright test --grep "@api"
npx playwright test --grep "@visual"
npx playwright test --grep "@a11y"
npx playwright test --grep "@e2e"

# Run against a specific environment (default: dev)
TEST_ENV=staging npx playwright test --project=api
TEST_ENV=prod    npx playwright test --project=api

# Create / update visual regression baselines (run locally after intentional UI changes)
npx playwright test --project=visual --update-snapshots

# Quality gate check (parses JSON report, fails if pass rate < threshold)
node scripts/quality-gate.mjs results.json 0.8
```

---

## Framework Architecture

### UI Layer
UI tests are implemented using the Page Object Model.

Page objects live in `pages/`:
- `LoginPage` — login form locators, actions, and assertions
- `InventoryPage` — product list, cart badge, sort dropdown, add/remove item
- `CartPage` — cart item list, proceed to checkout
- `CheckoutPage` — shipping form, order summary, confirmation

Each page object stores locators, exposes user actions, and provides reusable assertions. Test files stay focused on intent, not on selectors.

---

### API Layer
API tests use dedicated clients instead of raw request logic in spec files.

```
api/
  clients/baseClient.ts      ← abstract: get/post/put/delete + defaultHeaders()
  clients/reqresClient.ts    ← business methods, extends BaseApiClient
  fixtures/apiFixtures.ts    ← Playwright fixture: { reqresClient }
  helpers/apiAssertions.ts   ← assertApiSuccess / assertStatus / assertSchema
  models/reqres.models.ts    ← TypeScript interfaces
  schemas/reqres.schemas.ts  ← Zod schemas for all API response shapes
```

`assertApiSuccess` handles a reqres.in quirk: the API may return 200 or 401. The `allowedStatuses` array models this contract — both are valid responses.

---

### Fixtures
Fixtures inject ready-to-use objects into tests:

- UI: `loginPage`, `inventoryPage` — from `fixtures/loginFixture.ts`
- API: `reqresClient` — from `api/fixtures/apiFixtures.ts`

**Important:** API tests must import `test` from `api/fixtures/apiFixtures`, not from `@playwright/test`. UI tests import from `fixtures/loginFixture`. Using the wrong import loses the injected fixture.

---

### Test Data
Centralized in `test-data/users.ts` (SauceDemo credentials and error message strings) and `tests/api/data/` (API payloads and data-driven case definitions).

---

### Data-Driven Test Pattern

Both API and UI test suites use a case-array pattern:

```ts
const cases = [{ name: '...', tags: ['@smoke'], ... }];

test.describe('Suite name', { tag: '@api' }, () => {
  for (const c of cases) {
    test(c.name, { tag: c.tags }, async ({ fixture }) => { ... });
  }
});
```

`test.step()` wraps every network call and every assertion block for readable HTML reports.

---

## Critical Technical Rules

### URL resolution (baseURL + client paths)
`baseURL` in `playwright.config.ts` is set from `config/env.ts` and **must end with a trailing slash**: `https://reqres.in/api/`

All paths in `ReqresClient` **must not start with `/`**: use `'users'`, not `'/users'`.

RFC 3986 rule: a path beginning with `/` replaces the entire base path. Without trailing slash + without leading slash, resolution fails with 404.

### Two independent test targets
- **API tests** hit `reqres.in`. No browser. `baseURL` is used.
- **UI tests** hit `saucedemo.com`. Browser required. SauceDemo URLs are hardcoded in `LoginPage.goto()` — `baseURL` is not used here.

---

## Visual Regression

Snapshots are platform-specific — filenames include the OS suffix (`-darwin` for macOS, `-linux` for Ubuntu).

- **macOS baselines** are committed to the repo.
- **Linux baselines** for CI are regenerated via the **"Update Visual Snapshots"** GitHub Actions workflow (manual trigger: Actions → Run workflow).

`visual_user` on SauceDemo has intentional visual bugs (shuffled product images, wrong prices). Its snapshot documents the known broken state. Do not update it without investigation.

---

## CI Structure

Five parallel jobs in `.github/workflows/playwright.yml`:

| Job | Project | Browser |
|-----|---------|---------|
| `api` | api | none |
| `ui` | chromium / firefox / webkit | matrix |
| `e2e` | e2e | chromium |
| `visual` | visual | chromium |
| `a11y` | a11y | chromium |

Each job runs a quality gate after tests:
```bash
node scripts/quality-gate.mjs results.json 0.8   # fail if < 80% pass
```

---

## Environment Config

`config/env.ts` reads `TEST_ENV` (default: `dev`). Throws immediately on unknown values — no silent misconfiguration.

All three envs currently point to the same reqres.in URL. Update `config/env.ts` when real staging/prod URLs become available.
