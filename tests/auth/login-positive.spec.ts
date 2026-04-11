import { test } from '../../fixtures/loginFixture';
import { users } from '../../test-data/users';

const positiveUsers = [
  {
    name: 'standard user can log in and sees inventory',
    user: users.standard,
    check: 'inventory',
  },
  {
    name: 'performance_glitch_user can log in (slower response)',
    user: users.performanceGlitch,
    check: 'slow',
    timeout: 10000,
  },
  {
    name: 'error_user can log in',
    user: users.error,
    check: 'simple',
  },
  {
    name: 'visual_user can log in',
    user: users.visual,
    check: 'simple',
  },
];

test.describe('Positive login tests', () => {
  for (const u of positiveUsers) {
    test(u.name, async ({ loginPage, inventoryPage }) => {
      await loginPage.login(u.user.username, u.user.password);

      if (u.check === 'inventory') {
        await inventoryPage.expectPageLoaded();
        await inventoryPage.expectItemsCountGreaterThan(0);
      } else if (u.check === 'slow') {
        await loginPage.expectLoginSuccess(u.timeout);
      } else {
        await loginPage.expectLoginSuccess();
      }
    });
  }
});
