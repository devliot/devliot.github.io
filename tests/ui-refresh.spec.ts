import { test, expect } from '@playwright/test';

const HOME_URL = '/';
const DEMO_ARTICLE_URL = '/article/01-demo-article';

test.describe('UI Refresh (Phase 8)', () => {

  // UI-01: White header background on both pages
  test('UI-01: header background is white on both pages', async ({ page }) => {
    await page.goto(HOME_URL);
    const header = page.locator('devliot-header');
    await expect(header).toHaveCSS('background-color', 'rgb(255, 255, 255)');

    await page.goto(DEMO_ARTICLE_URL);
    await page.waitForSelector('devliot-article-page article h1', { timeout: 10000 });
    await expect(header).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  });

  // UI-01: Scroll shadow absent when page is at top
  test('UI-01: scroll shadow absent when page is at top', async ({ page }) => {
    await page.goto(HOME_URL);
    const header = page.locator('devliot-header');
    await expect(header).toHaveCSS('box-shadow', 'none');
  });

  // UI-01: Scroll shadow appears after scrolling
  test('UI-01: scroll shadow appears after scrolling', async ({ page }) => {
    await page.goto(DEMO_ARTICLE_URL);
    await page.waitForSelector('devliot-article-page article h1', { timeout: 10000 });
    await page.evaluate(() => window.scrollTo(0, 100));
    await page.waitForTimeout(300); // transition 0.2s + buffer
    const shadow = await page.locator('devliot-header').evaluate(
      el => getComputedStyle(el).boxShadow
    );
    expect(shadow).not.toBe('none');
  });

  // UI-02: Footer background is white
  test('UI-02: footer background is white', async ({ page }) => {
    await page.goto(HOME_URL);
    const footer = page.locator('devliot-footer');
    await expect(footer).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  });

  // UI-03: Home header has search affordance and no logo
  test('UI-03: home header has search affordance and no logo', async ({ page }) => {
    await page.goto(HOME_URL);
    const header = page.locator('devliot-header');
    const searchBtn = header.locator('.search-btn');
    await expect(searchBtn).toBeVisible();
    const logo = header.locator('pre[aria-label="DEVLIOT"]');
    await expect(logo).toHaveCount(0);
  });

  // UI-03: Home header has no hamburger menu button
  test('UI-03: home header has no hamburger menu button', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(HOME_URL);
    const header = page.locator('devliot-header');
    const hamburger = header.locator('button[aria-label="Ouvrir le menu"]');
    await expect(hamburger).toHaveCount(0);
  });

  // UI-04: Article header has logo and no search
  test('UI-04: article header has logo and no search', async ({ page }) => {
    await page.goto(DEMO_ARTICLE_URL);
    await page.waitForSelector('devliot-article-page article h1', { timeout: 10000 });
    const header = page.locator('devliot-header');
    const logo = header.locator('pre[aria-label="DEVLIOT"]');
    await expect(logo).toBeVisible();
    const searchBtn = header.locator('.search-btn');
    await expect(searchBtn).toHaveCount(0);
  });

  // UI-04: Article header has no hamburger menu button
  test('UI-04: article header has no hamburger menu button', async ({ page }) => {
    await page.goto(DEMO_ARTICLE_URL);
    await page.waitForSelector('devliot-article-page article h1', { timeout: 10000 });
    await page.setViewportSize({ width: 375, height: 812 });
    const header = page.locator('devliot-header');
    const hamburger = header.locator('button[aria-label="Ouvrir le menu"]');
    await expect(hamburger).toHaveCount(0);
  });

});
