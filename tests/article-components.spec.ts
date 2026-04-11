import { test, expect } from '@playwright/test';

// All tests navigate to the demo article
const DEMO_URL = '/#/article/demo-article';

test.describe('Article Components (Phase 3)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(DEMO_URL);
    // Wait for article content to load (unsafeHTML injection)
    await page.waitForSelector('devliot-article-page article h1', { timeout: 10000 });
  });

  // ART-01: Articles written in HTML rendered via Lit components
  test('ART-01: article HTML content renders in devliot-article-page', async ({ page }) => {
    // Article page exists and has rendered content
    const articlePage = page.locator('devliot-article-page');
    await expect(articlePage).toBeVisible();

    // Article title is rendered
    const title = articlePage.locator('article h1');
    await expect(title).toHaveText('Article Components Demo');

    // Prose paragraphs are rendered
    const firstParagraph = articlePage.locator('article p').first();
    await expect(firstParagraph).toBeVisible();
  });

  // ART-02: Syntax highlighting with copy button (Shiki)
  test('ART-02: code blocks render with syntax highlighting and copy button', async ({ page }) => {
    // Wait for Shiki to highlight (async operation)
    const codeBlock = page.locator('devliot-code').first();
    await expect(codeBlock).toBeVisible();

    // Shiki produces a pre.shiki element inside shadow DOM
    const shikiPre = codeBlock.locator('pre.shiki');
    await expect(shikiPre).toBeVisible({ timeout: 15000 }); // Shiki async load

    // Language badge is visible
    const langBadge = codeBlock.locator('.lang-badge');
    await expect(langBadge).toBeVisible();
    await expect(langBadge).toHaveText('TYPESCRIPT');

    // Line numbers are present (CSS counter via .line::before)
    const lines = codeBlock.locator('pre.shiki .line');
    await expect(lines.first()).toBeVisible();

    // Copy button exists (hidden by default, visible on hover)
    const copyBtn = codeBlock.locator('.copy-btn');
    await expect(copyBtn).toHaveCount(1);

    // Hover to reveal copy button
    await codeBlock.hover();
    await expect(copyBtn).toBeVisible();
  });

  // ART-03: Math formula rendering (KaTeX)
  test('ART-03: inline and block math render via KaTeX', async ({ page }) => {
    // Inline math: look for katex class inside devliot-math
    const inlineMath = page.locator('devliot-math:not([display])').first();
    await expect(inlineMath).toBeVisible();

    // KaTeX renders .katex class elements (Playwright auto-pierces shadow DOM)
    const katexSpan = inlineMath.locator('.katex');
    await expect(katexSpan).toBeVisible();

    // Block/display math
    const blockMath = page.locator('devliot-math[display]').first();
    await expect(blockMath).toBeVisible();

    const blockKatex = blockMath.locator('.katex');
    await expect(blockKatex).toBeVisible();
  });

  // ART-04: Images with figure/figcaption
  test('ART-04: figure with image and auto-numbered caption renders', async ({ page }) => {
    const figure = page.locator('devliot-article-page article figure').first();
    await expect(figure).toBeVisible();

    // Image inside figure
    const img = figure.locator('img');
    await expect(img).toBeVisible();

    // Figcaption exists
    const caption = figure.locator('figcaption');
    await expect(caption).toBeVisible();
    // CSS counter adds "Figure 1: " prefix — verify figcaption text content exists
    await expect(caption).not.toBeEmpty();
  });

  // ART-05: Heading anchor links (deep links)
  test('ART-05: headings have anchor links that appear on hover', async ({ page }) => {
    // Find a heading with an anchor link
    const heading = page.locator('devliot-article-page article h2').first();
    await expect(heading).toBeVisible();

    // Heading should have an id attribute (injected by article page)
    const headingId = await heading.getAttribute('id');
    expect(headingId).toBeTruthy();

    // Anchor element exists inside heading
    const anchor = heading.locator('.heading-anchor');
    await expect(anchor).toHaveCount(1);
    await expect(anchor).toHaveText('#');

    // Anchor appears on heading hover
    await heading.hover();
    await expect(anchor).toBeVisible();
  });

  // ART-06: Mermaid diagrams (lazy-loaded)
  test('ART-06: Mermaid diagram renders when scrolled into view', async ({ page }) => {
    const diagram = page.locator('devliot-diagram').first();

    // Scroll diagram into view to trigger lazy load
    await diagram.scrollIntoViewIfNeeded();

    // Wait for Mermaid to render SVG (lazy load + render)
    // devliot-diagram uses light DOM, so SVG is directly accessible
    const svg = diagram.locator('svg');
    await expect(svg).toBeVisible({ timeout: 30000 }); // Mermaid is heavy, give it time

    // SVG should contain diagram elements
    const svgContent = await svg.innerHTML();
    expect(svgContent.length).toBeGreaterThan(0);
  });

  // ART-07: Chart.js charts (lazy-loaded)
  test('ART-07: Chart.js chart renders when scrolled into view', async ({ page }) => {
    const chart = page.locator('devliot-chart').first();

    // Scroll chart into view to trigger lazy load
    await chart.scrollIntoViewIfNeeded();

    // Wait for Chart.js to render on canvas (shadow DOM)
    const canvas = chart.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 30000 });

    // Verify chart was instantiated by checking canvas dimensions
    // Chart.js sets width/height on the canvas element inside shadow DOM
    await page.waitForFunction(
      (el) => {
        const c = (el as Element)?.shadowRoot?.querySelector('canvas');
        return c && c.width > 0 && c.height > 0;
      },
      await chart.elementHandle(),
      { timeout: 15000 }
    );
  });

  // ART-01 error state: invalid slug (fails validation regex) shows error immediately
  // Uses a slug with special characters that fail /^[a-zA-Z0-9_-]+$/ validation.
  // Note: the hash router decodes the slug before passing it to the component.
  // A slug like "..evil" (with dots) fails the regex guard and shows the error without a fetch.
  test('ART-01: invalid article slug shows not found message', async ({ page }) => {
    // Navigate to a URL that encodes a slug with special chars that fail slug validation
    await page.goto('/#/article/..invalid-slug');
    const articlePage = page.locator('devliot-article-page');

    // Wait for error message — error state renders <article class="error-state"><p>...</p></article>
    const errorText = articlePage.locator('article.error-state p');
    await expect(errorText).toHaveText('Article not found.', { timeout: 10000 });
  });
});
