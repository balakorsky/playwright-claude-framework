import { test as base } from '@playwright/test';

export interface ObservedRequest {
  status: number;
  url: string;
}

export interface ObservabilityContext {
  consoleErrors: string[];
  failedRequests: ObservedRequest[];
  /** Throws if any critical console errors or failed app requests were recorded. */
  assertClean: () => void;
}

/**
 * Returns true for URLs that are not part of the SauceDemo application.
 * Third-party analytics and tracking 4xx errors are acceptable noise.
 */
function isThirdParty(url: string): boolean {
  return !url.includes('saucedemo.com');
}

/**
 * Returns true for errors that are known/expected noise, not application bugs.
 */
function isAcceptableConsoleError(text: string): boolean {
  const noise = [
    'favicon',
    'Download the React DevTools',
    'ResizeObserver loop',
    'Non-Error promise rejection',
  ];
  return noise.some((n) => text.includes(n));
}

type ObservabilityFixtures = {
  observe: ObservabilityContext;
};

export const test = base.extend<ObservabilityFixtures>({
  observe: async ({ page }, use) => {
    const consoleErrors: string[] = [];
    const failedRequests: ObservedRequest[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error' && !isAcceptableConsoleError(msg.text())) {
        consoleErrors.push(msg.text());
      }
    });

    page.on('response', (response) => {
      const status = response.status();
      const url = response.url();
      if (status >= 400 && !isThirdParty(url)) {
        failedRequests.push({ status, url });
      }
    });

    const ctx: ObservabilityContext = {
      consoleErrors,
      failedRequests,
      assertClean() {
        if (consoleErrors.length > 0) {
          throw new Error(
            `${consoleErrors.length} console error(s) during flow:\n` +
              consoleErrors.map((e) => `  • ${e}`).join('\n'),
          );
        }
        if (failedRequests.length > 0) {
          throw new Error(
            `${failedRequests.length} failed app request(s):\n` +
              failedRequests.map((r) => `  • ${r.status} ${r.url}`).join('\n'),
          );
        }
      },
    };

    await use(ctx);
  },
});

export { expect } from '@playwright/test';
