import { test } from '../../fixtures/loginFixture';
import { users, errorMessages } from '../../test-data/users';

const negativeCases = [
  {
    name: 'login fails with wrong password',
    username: users.standard.username,
    password: 'wrong_password',
    error: errorMessages.invalidCredentials,
  },
  {
    name: 'login fails with wrong username',
    username: users.wrong.username,
    password: users.wrong.password,
    error: errorMessages.invalidCredentials,
  },
  {
    name: 'login fails with both wrong username and password',
    username: users.wrong.username,
    password: 'wrong_password',
    error: errorMessages.invalidCredentials,
  },
  {
    name: 'locked_out_user cannot log in',
    username: users.lockedOut.username,
    password: users.lockedOut.password,
    error: errorMessages.lockedOut,
  },
];

test.describe('Negative login tests: invalid credentials', () => {
  for (const c of negativeCases) {
    test(c.name, async ({ loginPage }) => {
      await loginPage.login(c.username, c.password);
      await loginPage.expectErrorMessage(c.error);
    });
  }
});