import { test, expect } from '../../fixtures/loginFixture';
import { users } from '../../test-data/users';

const wrongCredentials = { username: users.wrong.username, password: 'wrong_password' };

const uiTests = [
  {
    name: 'login page has correct title',
    action: async ({ page }) => {
      await expect(page).toHaveTitle(/Swag Labs/);
    },
  },
  {
    name: 'password field masks input',
    action: async ({ loginPage }) => {
      const inputType = await loginPage.passwordInput.getAttribute('type');
      expect(inputType).toBe('password');
    },
  },
  {
    name: 'error message can be dismissed with X button',
    action: async ({ loginPage }) => {
      await loginPage.loginButton.click();
      await loginPage.expectErrorVisible();

      await loginPage.dismissError();
      await loginPage.expectErrorDismissed();
    },
  },
  {
    name: 'user stays on login page after failed login',
    action: async ({ loginPage, page }) => {
      await loginPage.login(wrongCredentials.username, wrongCredentials.password);
      await expect(page).toHaveURL('https://www.saucedemo.com/');
    },
  },
];

test.describe('Login page UI tests', () => {
  for (const uiTest of uiTests) {
    test(uiTest.name, async ({ page, loginPage }) => {
      await uiTest.action({ page, loginPage });
    });
  }
});