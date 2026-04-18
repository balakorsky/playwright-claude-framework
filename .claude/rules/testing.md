# Testing Rules

## Imports

Always import `test` from the correct fixture — never from `@playwright/test` directly:

```ts
// API tests
import { test, expect } from '../../api/fixtures/apiFixtures';

// UI tests (auth)
import { test, expect } from '../../fixtures/loginFixture';

// Visual / a11y / e2e (no custom fixture needed)
import { test, expect } from '@playwright/test';
```

## test.step() is mandatory

Every network call and every assertion block must be wrapped in `test.step()`:

```ts
const response = await test.step('GET /users', () => client.getUsers());
await test.step('Assert schema and count', async () => {
  const list = assertSchema(UsersListResponseSchema, await response.json());
  expect(list.data.length).toBeGreaterThan(0);
});
```

Never write bare `await client.getX()` or `expect(...)` at the top level of a test body.

## Tags

Every `test.describe` must have a suite-level tag. Individual tests get granular tags.

| Tag | When to use |
|-----|------------|
| `@api` | All API tests |
| `@smoke` | Happy path, runs on every push |
| `@regression` | Edge cases, negative flows |
| `@e2e` | End-to-end business scenarios |
| `@visual` | Screenshot regression tests |
| `@a11y` | Accessibility checks |

```ts
test.describe('Suite name', { tag: '@api' }, () => {
  test('case name', { tag: ['@smoke'] }, async ({ reqresClient }) => { ... });
});
```

## Data-driven pattern

Group related tests as a case array, not repeated `test()` blocks:

```ts
const cases = [
  { name: '...', tags: ['@smoke'], input: { ... } },
  { name: '...', tags: ['@regression'], input: { ... } },
];

test.describe('Suite', { tag: '@api' }, () => {
  for (const c of cases) {
    test(c.name, { tag: c.tags }, async ({ fixture }) => {
      // use c.input
    });
  }
});
```

## API schema validation

Always call `assertSchema` before accessing any fields on an API response body:

```ts
const body = await response.json();
const user = assertSchema(UserResponseSchema, body); // throws with details if invalid
expect(user.data.id).toBe(2);
```

Never do `const body = await response.json(); expect(body.data.id)...` without schema validation.

## allowedStatuses pattern

reqres.in can return 200 or 401 — both are valid. Use `assertApiSuccess` with `allowedStatuses`:

```ts
await assertApiSuccess(response, 200, [200, 401], (body) => {
  // only runs when status === 200
});
```

Do not assert a single status code directly — always use the `allowedStatuses` array.
