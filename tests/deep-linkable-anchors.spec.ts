import { test, expect } from '@playwright/test';

// All tests navigate to the demo article
const DEMO_URL = '/#/article/01-demo-article';

test.describe('Deep-linkable Anchors', () => {

  // ANCH-01: anchor click updates URL with ?section= via pushState
  test('ANCH-01: anchor click updates URL with ?section= via pushState', async ({ page }) => {
    await page.goto(DEMO_URL);
    await page.waitForSelector('devliot-article-page article h1', { timeout: 10000 });

    // Hover the first h2 to reveal the anchor
    const firstH2 = page.locator('devliot-article-page article h2').first();
    await firstH2.hover();

    // Click the heading anchor
    const anchor = firstH2.locator('.heading-anchor');
    await anchor.click();

    // Assert ?section= is in the URL search params
    const url = new URL(page.url());
    expect(url.searchParams.get('section')).toBeTruthy();

    // Assert the hash still contains the article route
    expect(page.url()).toContain('#/article/01-demo-article');
  });

  // ANCH-02: loading URL with ?section= scrolls to heading
  test('ANCH-02: loading URL with ?section= scrolls to heading', async ({ page }) => {
    await page.goto('/?section=code-highlighting#/article/01-demo-article');
    await page.waitForSelector('devliot-article-page article h1', { timeout: 10000 });
    await page.waitForTimeout(1500);

    const headingBox = await page.locator('devliot-article-page #code-highlighting').boundingBox();
    expect(headingBox).not.toBeNull();

    const viewportSize = page.viewportSize();
    expect(viewportSize).not.toBeNull();

    // Heading must be in viewport (y > 0 and y < viewport height)
    expect(headingBox!.y).toBeGreaterThan(0);
    expect(headingBox!.y).toBeLessThan(viewportSize!.height);
  });

  // ANCH-03: heading lands below sticky header (header-height offset)
  test('ANCH-03: heading lands below sticky header', async ({ page }) => {
    await page.goto('/?section=code-highlighting#/article/01-demo-article');
    await page.waitForSelector('devliot-article-page article h1', { timeout: 10000 });
    await page.waitForTimeout(1500);

    const headerBox = await page.locator('devliot-header').boundingBox();
    const headingBox = await page.locator('devliot-article-page #code-highlighting').boundingBox();

    expect(headerBox).not.toBeNull();
    expect(headingBox).not.toBeNull();

    // Heading top must be at or below the bottom edge of the header
    expect(headingBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height);
  });

  // ANCH-04: back button returns to prior ?section= state
  test('ANCH-04: back button returns to prior ?section= state', async ({ page }) => {
    await page.goto(DEMO_URL);
    await page.waitForSelector('devliot-article-page article h1', { timeout: 10000 });

    const h2Elements = page.locator('devliot-article-page article h2');

    // Click first h2 anchor
    const firstH2 = h2Elements.nth(0);
    await firstH2.hover();
    await firstH2.locator('.heading-anchor').click();
    const firstSection = new URL(page.url()).searchParams.get('section');

    // Click second h2 anchor
    const secondH2 = h2Elements.nth(1);
    await secondH2.scrollIntoViewIfNeeded();
    await secondH2.hover();
    await secondH2.locator('.heading-anchor').click();
    const secondSection = new URL(page.url()).searchParams.get('section');

    // Sections must be different
    expect(firstSection).not.toBe(secondSection);

    // Go back
    await page.goBack();
    await page.waitForTimeout(500);

    // URL must reflect the first section
    const currentSection = new URL(page.url()).searchParams.get('section');
    expect(currentSection).toBe(firstSection);

    // Article must still be visible (no remount)
    await expect(page.locator('devliot-article-page article h1')).toBeVisible();
  });

  // ANCH-05: h2 and h3 have anchors, h4+ do not
  test('ANCH-05: h2 and h3 have anchors, h4+ do not', async ({ page }) => {
    await page.goto(DEMO_URL);
    await page.waitForSelector('devliot-article-page article h1', { timeout: 10000 });

    // h2 and h3 must have anchors
    const h2AnchorCount = await page.locator('devliot-article-page article h2 .heading-anchor').count();
    const h3AnchorCount = await page.locator('devliot-article-page article h3 .heading-anchor').count();
    expect(h2AnchorCount).toBeGreaterThan(0);
    expect(h3AnchorCount).toBeGreaterThan(0);

    // h4, h5, h6 must NOT have anchors
    const h4AnchorCount = await page.locator('devliot-article-page article h4 .heading-anchor').count();
    const h5AnchorCount = await page.locator('devliot-article-page article h5 .heading-anchor').count();
    const h6AnchorCount = await page.locator('devliot-article-page article h6 .heading-anchor').count();
    expect(h4AnchorCount).toBe(0);
    expect(h5AnchorCount).toBe(0);
    expect(h6AnchorCount).toBe(0);
  });

  // ANCH-02 edge case: missing section is silently stripped
  test('ANCH-02: missing section is silently stripped', async ({ page }) => {
    await page.goto('/?section=nonexistent-heading#/article/01-demo-article');
    await page.waitForSelector('devliot-article-page article h1', { timeout: 10000 });
    await page.waitForTimeout(1500);

    // ?section= must be stripped from URL
    const url = new URL(page.url());
    expect(url.searchParams.has('section')).toBe(false);

    // Page must be near the top
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(100);
  });

});
