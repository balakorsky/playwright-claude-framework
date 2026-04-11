import { test } from '../../fixtures/loginFixture';
import { users } from '../../test-data/users';

const edgeCaseTests = [
  {
    name: 'login fails with SQL injection in username',
    username: "' OR '1'='1",
    password: users.standard.password,
  },
  {
    name: 'login fails with XSS attempt in username',
    username: '<script>alert(1)</script>',
    password: users.standard.password,
  },
  {
    name: 'login fails with very long username',
    username: 'a'.repeat(500),
    password: users.standard.password,
  },
  {
    name: 'login fails with case-sensitive username',
    username: 'Standard_User',
    password: users.standard.password,
  },
];

test.describe('Negative login tests: edge case inputs', () => {
  for (const testCase of edgeCaseTests) {
    test(testCase.name, async ({ loginPage }) => {
      await loginPage.login(testCase.username, testCase.password);
      await loginPage.expectErrorVisible();
      await loginPage.expectLoginFailed();
    });
  }
});