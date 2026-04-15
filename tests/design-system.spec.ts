import { test, expect } from '@playwright/test';

const BREAKPOINTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
] as const;

test.describe('BRAND-01: ASCII Logo', () => {
  test('header logo — ASCII art pre element is visible in header', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/article/01-demo-article');
    await page.waitForSelector('devliot-article-page article h1', { timeout: 10000 });
    const header = page.locator('devliot-header');
    const pre = header.locator('pre[aria-label="DEVLIOT"]');
    await expect(pre).toBeVisible();
  });

  test('hero logo — ASCII art pre element is visible on home page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    const home = page.locator('devliot-home-page');
    const pre = home.locator('pre[aria-label="DEVLIOT"]');
    await expect(pre).toBeVisible();
  });
});

test.describe('BRAND-02: Typography and Colors', () => {
  test('body font — Inter is applied to body text', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    const body = page.locator('body');
    const fontFamily = await body.evaluate(el => getComputedStyle(el).fontFamily);
    expect(fontFamily.toLowerCase()).toContain('inter');
  });

  test('code font — Fira Code is applied to code elements', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/article/01-demo-article');
    await page.waitForSelector('devliot-article-page article h1', { timeout: 10000 });
    // Test against the pre element in header (ASCII logo uses Fira Code)
    const header = page.locator('devliot-header');
    const pre = header.locator('pre');
    const fontFamily = await pre.evaluate(el => getComputedStyle(el).fontFamily);
    expect(fontFamily.toLowerCase()).toContain('fira code');
  });

  test('accent color — links use #333333 (grayscale)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/article/01-demo-article');
    await page.waitForSelector('devliot-article-page article h1', { timeout: 10000 });
    const header = page.locator('devliot-header');
    const link = header.locator('a');
    const color = await link.evaluate(el => getComputedStyle(el).color);
    // #333333 = rgb(51, 51, 51)
    expect(color).toBe('rgb(51, 51, 51)');
  });
});

test.describe('INFRA-05: Responsive Layout', () => {
  for (const bp of BREAKPOINTS) {
    test(`no horizontal overflow at ${bp.name} (${bp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto('/');
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  }

  test('sticky header — position is sticky', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const header = page.locator('devliot-header');
    await expect(header).toHaveCSS('position', 'sticky');
  });

  test('max-width — content column is 720px at desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    const app = page.locator('devliot-app');
    const main = app.locator('main');
    const maxWidth = await main.evaluate(el => getComputedStyle(el).maxWidth);
    expect(maxWidth).toBe('720px');
  });


});
