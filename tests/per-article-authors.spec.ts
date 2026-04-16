import { test, expect } from '@playwright/test';

test.describe('Article Authors -- AUTHOR-02 (byline, dev server)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/article/01-demo-article');
    // Wait for article content to load (same pattern as article-metadata.spec.ts)
    await page.locator('devliot-article-page').locator('article h1').waitFor({ timeout: 10000 });
  });

  test("AUTHOR-02: byline displays 'par Eliott et Sample Coauthor'", async ({ page }) => {
    const byline = page.locator('devliot-article-page').locator('.article-byline');
    await expect(byline).toBeVisible();
    await expect(byline).toContainText('par Eliott et Sample Coauthor');
  });

  test('AUTHOR-02: first author is a link to their URL', async ({ page }) => {
    const link = page.locator('devliot-article-page').locator('.article-byline a').first();
    await expect(link).toHaveAttribute('href', 'https://github.com/devliot');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener');
    await expect(link).toContainText('Eliott');
  });

  test('AUTHOR-02: second author without URL renders as plain text', async ({ page }) => {
    const byline = page.locator('devliot-article-page').locator('.article-byline');
    const text = await byline.textContent();
    expect(text).toContain('Sample Coauthor');
    // Only Eliott has a link — Sample Coauthor renders as plain text
    const links = page.locator('devliot-article-page').locator('.article-byline a');
    await expect(links).toHaveCount(1);
  });

  test('AUTHOR-02: byline appears below .article-meta and above article', async ({ page }) => {
    const metaBox = await page.locator('devliot-article-page').locator('.article-meta').boundingBox();
    const bylineBox = await page.locator('devliot-article-page').locator('.article-byline').boundingBox();
    const articleBox = await page.locator('devliot-article-page').locator('article').boundingBox();
    expect(metaBox).not.toBeNull();
    expect(bylineBox).not.toBeNull();
    expect(articleBox).not.toBeNull();
    expect(metaBox!.y).toBeLessThan(bylineBox!.y);
    expect(bylineBox!.y).toBeLessThan(articleBox!.y);
  });

  test('AUTHOR-02: byline uses muted styling', async ({ page }) => {
    const byline = page.locator('devliot-article-page').locator('.article-byline');
    await expect(byline).toBeVisible();
    const color = await byline.evaluate(el => getComputedStyle(el).color);
    // --color-text-muted is #666666 = rgb(102, 102, 102)
    expect(color).toBe('rgb(102, 102, 102)');
    const fontSize = await byline.evaluate(el => getComputedStyle(el).fontSize);
    expect(fontSize).toBe('14px');
  });
});

// AUTHOR-03 tests require a production build (npm run build) to be run first.
// The OG HTML files are generated into dist/ by the post-build script.
// These tests read the generated file directly using Node.js fs to avoid
// the redirect script that would redirect Playwright away from the page.
// All AUTHOR-03 tests are RED until Plan 02 implements JSON-LD generation.
test.describe('Article Authors -- AUTHOR-03 (JSON-LD, production build)', () => {
  test('AUTHOR-03: og.html contains JSON-LD script block', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const ogPath = path.join(process.cwd(), 'dist', 'articles', '01-demo-article', 'og.html');
    const html = fs.readFileSync(ogPath, 'utf8');
    expect(html).toContain('application/ld+json');
    expect(html).toContain('"@type":"BlogPosting"');
  });

  test('AUTHOR-03: JSON-LD author array matches index.json authors', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const ogPath = path.join(process.cwd(), 'dist', 'articles', '01-demo-article', 'og.html');
    const html = fs.readFileSync(ogPath, 'utf8');
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    const schema = JSON.parse(match![1]);
    expect(Array.isArray(schema.author)).toBe(true);
    expect(schema.author).toHaveLength(2);
    expect(schema.author[0].name).toBe('Eliott');
    expect(schema.author[0].url).toBe('https://github.com/devliot');
    expect(schema.author[1].name).toBe('Sample Coauthor');
    expect(schema.author[1].url).toBeUndefined();
  });

  test('AUTHOR-03: JSON-LD contains publisher Organization', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const ogPath = path.join(process.cwd(), 'dist', 'articles', '01-demo-article', 'og.html');
    const html = fs.readFileSync(ogPath, 'utf8');
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    const schema = JSON.parse(match![1]);
    expect(schema.publisher['@type']).toBe('Organization');
    expect(schema.publisher.name).toBe('DEVLIOT');
    expect(schema.publisher.url).toBe('https://devliot.github.io');
  });

  test('AUTHOR-03: JSON-LD contains headline and datePublished', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const ogPath = path.join(process.cwd(), 'dist', 'articles', '01-demo-article', 'og.html');
    const html = fs.readFileSync(ogPath, 'utf8');
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    const schema = JSON.parse(match![1]);
    expect(schema.headline).toBe('Article Components Demo');
    expect(schema.datePublished).toBe('2026-04-11');
  });

  test('AUTHOR-03: JSON-LD contains description and image when present', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const ogPath = path.join(process.cwd(), 'dist', 'articles', '01-demo-article', 'og.html');
    const html = fs.readFileSync(ogPath, 'utf8');
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    const schema = JSON.parse(match![1]);
    expect(typeof schema.description).toBe('string');
    expect(schema.description.length).toBeGreaterThan(0);
    expect(schema.image).toContain('https://devliot.github.io/');
  });
});
