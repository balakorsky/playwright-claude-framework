/**
 * Accessibility smoke tests using axe-core.
 * Checks WCAG 2.1 AA violations on key page states.
 *
 * Run standalone:
 *   npx playwright test --project=a11y
 *
 * To see violation details in the report, the assertion error prints
 * each violation with its description and affected nodes.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { LoginPage } from '../../pages/LoginPage';
import { users } from '../../test-data/users';

function formatViolations(violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']): string {
  if (violations.length === 0) return '';
  return violations
    .map((v) => `[${v.impact}] ${v.id}: ${v.description}\n  nodes: ${v.nodes.length}`)
    .join('\n');
}

test.describe('Accessibility smoke – login page', { tag: ['@a11y', '@smoke'] }, () => {
  test('login page has no critical or serious violations', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(critical, `Violations found:\n${formatViolations(critical)}`).toHaveLength(0);
  });

  test('login page error state has no critical violations', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginButton.click(); // trigger empty-form error — error banner appears

    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(critical, `Violations found:\n${formatViolations(critical)}`).toHaveLength(0);
  });
});

test.describe('Accessibility smoke – inventory page', { tag: ['@a11y', '@regression'] }, () => {
  test('standard_user inventory page has no critical violations', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
    await page.waitForURL(/inventory/);

    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(critical, `Violations found:\n${formatViolations(critical)}`).toHaveLength(0);
  });
});
