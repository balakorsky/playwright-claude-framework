/**
 * Asset health — DOM-level verification.
 *
 * Checks that assets are not only requested but actually rendered:
 *  - naturalWidth > 0 means the browser decoded the image successfully
 *  - naturalWidth === 0 means the image failed even if the server returned 200
 *    (e.g. corrupted data, wrong MIME type, CORS block)
 *
 * Also verifies:
 *  - all images have alt text (accessibility + health overlap)
 *  - CSS is applied (computed styles are not default browser styles)
 *  - no saucedemo.com asset requests return 4xx / 5xx
 *  - problem_user images: all render, but all are the same URL (known bug)
 */

import { test, expect } from '../../fixtures/healthFixture';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { users } from '../../test-data/users';

interface ImageRecord {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  alt: string;
  complete: boolean;
}

async function loginAs(page, user: { username: string; password: string }) {
  const lp = new LoginPage(page);
  await lp.goto();
  await lp.login(user.username, user.password);
  await new InventoryPage(page).expectPageLoaded();
}

async function collectImages(page): Promise<ImageRecord[]> {
  await page.waitForLoadState('networkidle');
  await page.locator('img').evaluateAll((imgs) =>
    Promise.all(
      imgs.map(
        (img) =>
          new Promise<void>((resolve) => {
            const image = img as HTMLImageElement;
            if (image.complete) {
              resolve();
              return;
            }
            image.addEventListener('load', () => resolve(), { once: true });
            image.addEventListener('error', () => resolve(), { once: true });
          }),
      ),
    ),
  );

  return page.locator('img').evaluateAll((imgs) =>
    imgs.map((img) => ({
      src: (img as HTMLImageElement).src,
      naturalWidth: (img as HTMLImageElement).naturalWidth,
      naturalHeight: (img as HTMLImageElement).naturalHeight,
      alt: (img as HTMLImageElement).alt,
      complete: (img as HTMLImageElement).complete,
    })),
  );
}

// ─── standard_user — all images render ───────────────────────────────────────

test.describe('standard_user — inventory images render correctly', { tag: ['@health', '@regression'] }, () => {
  test('all 6 product images have naturalWidth > 0', async ({ page, health }) => {
    await test.step('Load inventory', () => loginAs(page, users.standard));

    await test.step('Collect image data', async () => {
      const images = await collectImages(page);
      const productImages = images.filter((img) => img.src.includes('/static/media/'));

      expect(productImages).toHaveLength(6);

      for (const img of productImages) {
        expect(
          img.naturalWidth,
          `Image did not render: ${img.src}`,
        ).toBeGreaterThan(0);
      }
    });

    await test.step('No failed asset requests', () => health.assertNoFailedAssets());
  });

  test('all 6 product images have distinct src URLs', async ({ page }) => {
    await test.step('Load inventory', () => loginAs(page, users.standard));

    await test.step('All image srcs are unique', async () => {
      const images = await collectImages(page);
      const productImages = images.filter((img) => img.src.includes('/static/media/'));
      const unique = new Set(productImages.map((img) => img.src));
      expect(unique.size).toBe(6);
    });
  });

  test('all product images have non-empty alt text', async ({ page }) => {
    await test.step('Load inventory', () => loginAs(page, users.standard));

    await test.step('Check alt attributes', async () => {
      const images = await collectImages(page);
      const productImages = images.filter((img) => img.src.includes('/static/media/'));

      for (const img of productImages) {
        expect(img.alt.trim(), `Missing alt text on: ${img.src}`).not.toBe('');
      }
    });
  });

  test('product detail page image renders', async ({ page, health }) => {
    await test.step('Open product detail page', async () => {
      await loginAs(page, users.standard);
      await new InventoryPage(page).openProductDetailByName('Sauce Labs Backpack');
    });

    await test.step('Detail image has naturalWidth > 0', async () => {
      const images = await collectImages(page);
      const detail = images.find((img) => img.src.includes('/static/media/'));
      expect(detail).toBeDefined();
      expect(detail!.naturalWidth).toBeGreaterThan(0);
    });

    await test.step('No failed assets', () => health.assertNoFailedAssets());
  });
});

// ─── CSS is applied ───────────────────────────────────────────────────────────

test.describe('CSS health — styles are applied', { tag: ['@health', '@regression'] }, () => {
  test('login button has non-default background color (CSS loaded)', async ({ page }) => {
    await test.step('Load login page', async () => {
      await page.goto('https://www.saucedemo.com/');
    });

    await test.step('Login button background-color is not the browser default', async () => {
      const bg = await page
        .locator('#login-button')
        .evaluate((el) => getComputedStyle(el).backgroundColor);
      // Default browser bg for a button is usually '' or 'rgba(0, 0, 0, 0)'
      expect(bg).not.toMatch(/^rgba\(0, 0, 0, 0\)$/);
      expect(bg).not.toBe('');
    });
  });

  test('inventory items have expected layout width (flexbox CSS loaded)', async ({ page }) => {
    await test.step('Login', () => loginAs(page, users.standard));

    await test.step('Inventory item has non-zero rendered width', async () => {
      const width = await page
        .locator('.inventory_item')
        .first()
        .evaluate((el) => el.getBoundingClientRect().width);
      expect(width).toBeGreaterThan(100);
    });
  });
});

// ─── No failed assets on any page load ───────────────────────────────────────

test.describe('No failed asset requests on page loads', { tag: ['@health', '@regression'] }, () => {
  for (const { label, navigate } of [
    {
      label: 'login page',
      navigate: async (page) => page.goto('https://www.saucedemo.com/'),
    },
    {
      label: 'inventory page',
      navigate: async (page) => {
        await loginAs(page, users.standard);
      },
    },
    {
      label: 'cart page',
      navigate: async (page) => {
        await loginAs(page, users.standard);
        await page.goto('https://www.saucedemo.com/cart.html');
      },
    },
  ]) {
    test(`no asset 4xx/5xx on ${label}`, async ({ page, health }) => {
      await test.step(`Navigate to ${label}`, () => navigate(page));
      await test.step('No failed assets', () => health.assertNoFailedAssets());
    });
  }
});

// ─── problem_user — images render but are wrong ───────────────────────────────

test.describe('problem_user — images render but are all the same (known bug)', { tag: ['@health', '@regression'] }, () => {
  test('all 6 product images render (naturalWidth > 0) but share one URL', async ({ page }) => {
    await test.step('Login as problem_user', () => loginAs(page, users.problem));

    await test.step('Images render but are identical (known bug)', async () => {
      const images = await collectImages(page);
      const productImages = images.filter((img) => img.src.includes('/static/media/'));

      // All images DO render (naturalWidth > 0) — the asset loads
      for (const img of productImages) {
        expect(img.naturalWidth, `Image did not render: ${img.src}`).toBeGreaterThan(0);
      }

      // But they all have the same src — the bug is in the data, not the assets
      const unique = new Set(productImages.map((img) => img.src));
      expect(unique.size).toBe(1);
    });
  });
});
