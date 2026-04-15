import { test, expect } from '@playwright/test';

test.describe('Article Metadata — META-02 & META-03 (dev server)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/article/01-demo-article');
    // Wait for article content to load (reuse existing pattern)
    await page.locator('devliot-article-page').locator('article h1').waitFor({ timeout: 10000 });
  });

  test('META-03: displays publication date in long format', async ({ page }) => {
    const meta = page.locator('devliot-article-page').locator('.article-meta');
    await expect(meta).toBeVisible();
    // Demo article date is 2026-04-11 -> "April 11, 2026"
    await expect(meta).toContainText('April 11, 2026');
  });

  test('META-03: date uses <time> element with datetime attribute', async ({ page }) => {
    const timeEl = page.locator('devliot-article-page').locator('.article-meta time');
    await expect(timeEl).toBeVisible();
    await expect(timeEl).toHaveAttribute('datetime', '2026-04-11');
    await expect(timeEl).toContainText('April 11, 2026');
  });

  test('META-02: displays reading time', async ({ page }) => {
    const meta = page.locator('devliot-article-page').locator('.article-meta');
    await expect(meta).toBeVisible();
    // Reading time should be a number followed by "min read"
    await expect(meta).toContainText(/\d+ min read/);
  });

  test('META-02 + META-03: metadata line shows date · reading time format', async ({ page }) => {
    const meta = page.locator('devliot-article-page').locator('.article-meta');
    await expect(meta).toBeVisible();
    // Full format: "April 11, 2026 · N min read" (middle dot separator)
    const text = await meta.textContent();
    expect(text).toMatch(/April 11, 2026\s*·\s*\d+ min read/);
  });

  test('META-02 + META-03: metadata line appears before article body', async ({ page }) => {
    // Verify .article-meta exists and is positioned before the <article> element
    const metaBox = await page.locator('devliot-article-page').locator('.article-meta').boundingBox();
    const articleBox = await page.locator('devliot-article-page').locator('article').boundingBox();
    expect(metaBox).not.toBeNull();
    expect(articleBox).not.toBeNull();
    // Metadata line's top should be above the article's top
    expect(metaBox!.y).toBeLessThan(articleBox!.y);
  });
});

// META-01 tests require a production build (npm run build) to be run first.
// The OG HTML files are generated into dist/ by the post-build script.
// These tests read the generated file directly using Node.js fs to avoid
// the redirect script that would redirect Playwright away from the page.
test.describe('Article Metadata — META-01 (OG pages, production build)', () => {
  test('META-01: OG HTML page exists for demo article', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const ogPath = path.join(process.cwd(), 'dist', 'articles', '01-demo-article', 'og.html');
    expect(fs.existsSync(ogPath)).toBe(true);
  });

  test('META-01: OG page contains correct og:title', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const ogPath = path.join(process.cwd(), 'dist', 'articles', '01-demo-article', 'og.html');
    const html = fs.readFileSync(ogPath, 'utf8');
    expect(html).toContain('og:title');
    expect(html).toContain('Article Components Demo');
  });

  test('META-01: OG page contains og:description from index.json', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const ogPath = path.join(process.cwd(), 'dist', 'articles', '01-demo-article', 'og.html');
    const html = fs.readFileSync(ogPath, 'utf8');
    expect(html).toContain('og:description');
    // Description should be non-empty (not content="")
    expect(html).not.toMatch(/og:description["']\s+content=["']["']/);
  });

  test('META-01: OG page contains absolute og:image URL', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const ogPath = path.join(process.cwd(), 'dist', 'articles', '01-demo-article', 'og.html');
    const html = fs.readFileSync(ogPath, 'utf8');
    expect(html).toContain('og:image');
    // Image URL must be absolute
    expect(html).toContain('https://devliot.github.io/articles/01-demo-article/og-image.png');
  });

  test('META-01: OG page uses twitter:card summary_large_image', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const ogPath = path.join(process.cwd(), 'dist', 'articles', '01-demo-article', 'og.html');
    const html = fs.readFileSync(ogPath, 'utf8');
    expect(html).toContain('twitter:card');
    expect(html).toContain('summary_large_image');
  });

  test('META-01: OG page contains redirect script to hash URL', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const ogPath = path.join(process.cwd(), 'dist', 'articles', '01-demo-article', 'og.html');
    const html = fs.readFileSync(ogPath, 'utf8');
    expect(html).toContain("window.location.replace('/#/article/01-demo-article')");
  });
});
