import { test } from '../../fixtures/loginFixture';
import { users, errorMessages } from '../../test-data/users';

const validationTests = [
  {
    name: 'login fails with both fields empty',
    username: '',
    password: '',
    expectedError: errorMessages.usernameRequired,
  },
  {
    name: 'login fails with empty username',
    username: '',
    password: users.standard.password,
    expectedError: errorMessages.usernameRequired,
  },
  {
    name: 'login fails with empty password',
    username: users.standard.username,
    password: '',
    expectedError: errorMessages.passwordRequired,
  },
  {
    name: 'login fails with whitespace-only username',
    username: '   ',
    password: 'secret_sauce',
    expectedError: null,
  },
];

test.describe('Negative login tests: empty fields', () => {
  for (const validationTest of validationTests) {
    test(validationTest.name, async ({ loginPage }) => {
      await loginPage.login(validationTest.username, validationTest.password);

      if (validationTest.expectedError) {
        await loginPage.expectErrorMessage(validationTest.expectedError);
      } else {
        await loginPage.expectErrorVisible();
      }
    });
  }
});