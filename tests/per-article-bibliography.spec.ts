import { test, expect } from '@playwright/test';

// Demo article bibliography (from public/articles/index.json):
// [1] vaswani-2017 — article type, 8 authors, year=2017, url=arxiv
// [2] bringhurst-2004 — book type, 1 author, year=2004, publisher="Hartley & Marks", no url
// [3] lit-docs — web type, no authors, url=lit.dev, no year
//
// Demo article inline markers (from public/articles/01-demo-article/index.html):
// Line 3:  [lit-docs]       → citation [3]
// Line 24: [vaswani-2017]   → citation [1]
// Line 58: [bringhurst-2004]→ citation [2]

test.describe('Bibliography -- REF-02 (references section, dev server)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/article/01-demo-article');
    await page.locator('devliot-article-page').locator('article h1').waitFor({ timeout: 10000 });
  });

  test('REF-02: references section visible with heading "Références"', async ({ page }) => {
    const referencesSection = page.locator('devliot-article-page').locator('.references');
    await expect(referencesSection).toBeVisible();
    const heading = page.locator('devliot-article-page').locator('.references h2');
    await expect(heading).toContainText('Références');
  });

  test('REF-02: three numbered entries [1], [2], [3]', async ({ page }) => {
    const entries = page.locator('devliot-article-page').locator('.ref-entry');
    await expect(entries).toHaveCount(3);
    await expect(entries.nth(0)).toContainText('[1]');
    await expect(entries.nth(1)).toContainText('[2]');
    await expect(entries.nth(2)).toContainText('[3]');
  });

  test('REF-02: article-type entry format (authors, title, year)', async ({ page }) => {
    // First entry: vaswani-2017 → [1]
    const firstEntry = page.locator('devliot-article-page').locator('.ref-entry').nth(0);
    const text = await firstEntry.textContent();
    expect(text).toContain('Vaswani, Ashish');
    expect(text).toContain('Attention Is All You Need');
    expect(text).toContain('2017');
    // Must NOT contain book publisher (that belongs to [2])
    expect(text).not.toContain('Hartley');
  });

  test('REF-02: book-type entry format (authors, title, publisher, year)', async ({ page }) => {
    // Second entry: bringhurst-2004 → [2]
    const secondEntry = page.locator('devliot-article-page').locator('.ref-entry').nth(1);
    const text = await secondEntry.textContent();
    expect(text).toContain('Bringhurst, Robert');
    expect(text).toContain('The Elements of Typographic Style');
    expect(text).toContain('Hartley & Marks');
    expect(text).toContain('2004');
  });

  test('REF-02: web-type entry format (title only, no authors)', async ({ page }) => {
    // Third entry: lit-docs → [3]
    const thirdEntry = page.locator('devliot-article-page').locator('.ref-entry').nth(2);
    const text = await thirdEntry.textContent();
    expect(text).toContain('Lit - Simple. Fast. Web Components.');
    // Web type has no authors — must NOT start with an em-dash author prefix
    // The text should begin with "[3]" immediately followed by the title, no "— " prefix
    expect(text).not.toMatch(/\[3\]\s+\S.*\s*\u2014/);
  });

  test('REF-02: title with URL renders as link (new tab)', async ({ page }) => {
    // First entry (vaswani-2017) has url → title is a link
    const firstEntryLink = page.locator('devliot-article-page').locator('#ref-1 a').first();
    await expect(firstEntryLink).toHaveAttribute('href', 'https://arxiv.org/abs/1706.03762');
    await expect(firstEntryLink).toHaveAttribute('target', '_blank');
    const rel = await firstEntryLink.getAttribute('rel');
    expect(rel).toContain('noopener');

    // Second entry (bringhurst-2004) has no url → no new-tab title link
    const secondEntryNewTabLinks = page.locator('devliot-article-page').locator('#ref-2 a[target="_blank"]');
    await expect(secondEntryNewTabLinks).toHaveCount(0);
  });

  test('REF-02: references section positioned between article and article-tags', async ({ page }) => {
    const articleBox = await page.locator('devliot-article-page').locator('article').boundingBox();
    const referencesBox = await page.locator('devliot-article-page').locator('.references').boundingBox();
    const tagsBox = await page.locator('devliot-article-page').locator('.article-tags').boundingBox();

    expect(articleBox).not.toBeNull();
    expect(referencesBox).not.toBeNull();
    expect(tagsBox).not.toBeNull();

    // References must appear after the article body ends
    expect(articleBox!.y + articleBox!.height).toBeLessThanOrEqual(referencesBox!.y);
    // Tags must appear after the references section ends
    expect(referencesBox!.y + referencesBox!.height).toBeLessThanOrEqual(tagsBox!.y);
  });

  test('REF-02: reference entries use muted styling (14px, #666666)', async ({ page }) => {
    const firstEntry = page.locator('devliot-article-page').locator('.ref-entry').first();
    const color = await firstEntry.evaluate(el => getComputedStyle(el).color);
    // --color-text-muted is #666666 = rgb(102, 102, 102)
    expect(color).toBe('rgb(102, 102, 102)');
    const fontSize = await firstEntry.evaluate(el => getComputedStyle(el).fontSize);
    expect(fontSize).toBe('14px');
  });

  test('REF-02: references section has border-top separator', async ({ page }) => {
    const referencesSection = page.locator('devliot-article-page').locator('.references');
    const borderStyle = await referencesSection.evaluate(el => getComputedStyle(el).borderTopStyle);
    expect(borderStyle).toBe('solid');
    const borderWidth = await referencesSection.evaluate(el => getComputedStyle(el).borderTopWidth);
    expect(borderWidth).toBe('1px');
  });
});

// REF-03 tests — these will be RED until Plan 02 implements _injectCitationLinks()
// Inline markers [id] are transformed to [N] citation links with back-links in the references section.
// Demo article marker positions:
//   [lit-docs]        → line 3  → citation [3] (lit-docs is 3rd in bibliography array, index 2, N=3)
//   [vaswani-2017]    → line 24 → citation [1] (vaswani-2017 is 1st in bibliography array, index 0, N=1)
//   [bringhurst-2004] → line 58 → citation [2] (bringhurst-2004 is 2nd in bibliography array, index 1, N=2)
test.describe('Bibliography -- REF-03 (inline citations + back-links, dev server)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/article/01-demo-article');
    await page.locator('devliot-article-page').locator('article h1').waitFor({ timeout: 10000 });
  });

  test('REF-03: inline [N] citation links appear in article body', async ({ page }) => {
    const citationLinks = page.locator('devliot-article-page').locator('article .citation-link');
    // 3 inline markers in the demo article
    await expect(citationLinks).toHaveCount(3);
    // First citation in document order is [lit-docs] → N=3
    await expect(citationLinks.nth(0)).toContainText('[3]');
    // Second citation in document order is [vaswani-2017] → N=1
    await expect(citationLinks.nth(1)).toContainText('[1]');
    // Third citation in document order is [bringhurst-2004] → N=2
    await expect(citationLinks.nth(2)).toContainText('[2]');
  });

  test('REF-03: citation link uses muted color, not accent', async ({ page }) => {
    const firstCitation = page.locator('devliot-article-page').locator('article .citation-link').first();
    const color = await firstCitation.evaluate(el => getComputedStyle(el).color);
    // --color-text-muted is #666666 = rgb(102, 102, 102)
    expect(color).toBe('rgb(102, 102, 102)');
  });

  test('REF-03: clicking citation [N] scrolls to reference entry', async ({ page }) => {
    // Click first .citation-link ([3] → points to #ref-3)
    const firstCitation = page.locator('devliot-article-page').locator('article .citation-link').first();
    await firstCitation.click();
    await page.waitForTimeout(1500); // wait for smooth scroll

    const ref3Box = await page.locator('devliot-article-page').locator('#ref-3').boundingBox();
    expect(ref3Box).not.toBeNull();

    const viewportSize = page.viewportSize();
    expect(viewportSize).not.toBeNull();

    // Target must be in viewport
    expect(ref3Box!.y).toBeGreaterThan(0);
    expect(ref3Box!.y).toBeLessThan(viewportSize!.height);
  });

  test('REF-03: each referenced entry has back-link', async ({ page }) => {
    const backlinks = page.locator('devliot-article-page').locator('.ref-backlink');
    // All 3 entries have matching inline citations in the demo
    await expect(backlinks).toHaveCount(3);
    // Back-link uses ↩ character (U+21A9)
    const firstBacklinkText = await backlinks.first().textContent();
    expect(firstBacklinkText).toContain('\u21a9');
  });

  test('REF-03: clicking back-link scrolls to inline citation', async ({ page }) => {
    // First back-link corresponds to ref-1 (vaswani-2017), pointing to #cite-1
    const firstBacklink = page.locator('devliot-article-page').locator('.ref-backlink').first();
    // Scroll to make it visible before clicking
    await firstBacklink.scrollIntoViewIfNeeded();
    await firstBacklink.click();
    await page.waitForTimeout(1500); // wait for smooth scroll

    const cite1Box = await page.locator('devliot-article-page').locator('#cite-1').boundingBox();
    expect(cite1Box).not.toBeNull();

    const viewportSize = page.viewportSize();
    expect(viewportSize).not.toBeNull();

    // Target must be in viewport
    expect(cite1Box!.y).toBeGreaterThan(0);
    expect(cite1Box!.y).toBeLessThan(viewportSize!.height);
  });

  test('REF-03: [id] with no bibliography match stays as plain text', async ({ page }) => {
    // All 3 [id] markers in the demo article should be transformed to [N] citation links.
    // If transformation works correctly, none of the original [id] strings should remain as literal text.
    const articleText = await page.locator('devliot-article-page').locator('article').evaluate(el => el.textContent ?? '');
    // None of the original marker ids should remain as literal bracket-wrapped text
    expect(articleText).not.toContain('[vaswani-2017]');
    expect(articleText).not.toContain('[bringhurst-2004]');
    expect(articleText).not.toContain('[lit-docs]');
    // All 3 citation links should account for all 3 markers (no extras, no missing)
    const citationLinks = page.locator('devliot-article-page').locator('article .citation-link');
    await expect(citationLinks).toHaveCount(3);
  });
});
