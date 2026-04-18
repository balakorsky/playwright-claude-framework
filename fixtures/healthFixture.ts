import { test as base, ConsoleMessage, Response } from '@playwright/test';

export interface ResourceRecord {
  url: string;
  status: number;
  resourceType: string;
}

export interface HealthContext {
  /** Every console.error() from app code (third-party noise filtered). */
  consoleErrors: string[];
  /** Every console.warn() from app code. */
  consoleWarnings: string[];
  /** All HTTP responses from saucedemo.com. */
  responses: ResourceRecord[];

  /** Throws if any console errors were recorded. */
  assertNoConsoleErrors(): void;
  /** Throws if any saucedemo.com request returned 4xx or 5xx. */
  assertNoFailedAppRequests(): void;
  /** Throws if any image, CSS, or JS asset returned 4xx or 5xx. */
  assertNoFailedAssets(): void;

  /** Failed saucedemo.com requests (any type). */
  failedRequests(): ResourceRecord[];
  /** Failed static assets: images, stylesheets, scripts. */
  failedAssets(): ResourceRecord[];

  /** One-line diagnostic summary for test.step output. */
  summary(): string;
}

type HealthFixtures = { health: HealthContext };

const ASSET_TYPES = new Set(['image', 'stylesheet', 'script', 'font', 'media']);
const THIRD_PARTY_NOISE = ['favicon', 'Download the React DevTools', 'ResizeObserver loop'];

function isAppUrl(url: string) {
  return url.includes('saucedemo.com');
}
function isThirdPartyConsole(text: string) {
  return THIRD_PARTY_NOISE.some((n) => text.includes(n));
}

export const test = base.extend<HealthFixtures>({
  health: async ({ page }, use) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    const responses: ResourceRecord[] = [];

    page.on('console', (msg: ConsoleMessage) => {
      if (isThirdPartyConsole(msg.text())) return;
      if (msg.type() === 'error') consoleErrors.push(msg.text());
      if (msg.type() === 'warning') consoleWarnings.push(msg.text());
    });

    page.on('response', (res: Response) => {
      if (!isAppUrl(res.url())) return;
      responses.push({
        url: res.url(),
        status: res.status(),
        resourceType: res.request().resourceType(),
      });
    });

    const ctx: HealthContext = {
      consoleErrors,
      consoleWarnings,
      responses,

      assertNoConsoleErrors() {
        if (consoleErrors.length > 0) {
          throw new Error(
            `${consoleErrors.length} console error(s):\n` +
              consoleErrors.map((e) => `  • ${e}`).join('\n'),
          );
        }
      },

      assertNoFailedAppRequests() {
        const failed = ctx.failedRequests();
        if (failed.length > 0) {
          throw new Error(
            `${failed.length} failed app request(s):\n` +
              failed.map((r) => `  • ${r.status} [${r.resourceType}] ${r.url}`).join('\n'),
          );
        }
      },

      assertNoFailedAssets() {
        const failed = ctx.failedAssets();
        if (failed.length > 0) {
          throw new Error(
            `${failed.length} failed asset(s):\n` +
              failed.map((r) => `  • ${r.status} [${r.resourceType}] ${r.url}`).join('\n'),
          );
        }
      },

      failedRequests() {
        return responses.filter((r) => r.status >= 400);
      },

      failedAssets() {
        return responses.filter((r) => r.status >= 400 && ASSET_TYPES.has(r.resourceType));
      },

      summary() {
        const failed = ctx.failedRequests().length;
        const errs = consoleErrors.length;
        const warns = consoleWarnings.length;
        return `console errors: ${errs} | warnings: ${warns} | failed requests: ${failed}`;
      },
    };

    await use(ctx);
  },
});

export { expect } from '@playwright/test';
