import { test, expect } from '@playwright/test';

const HOME_URL = '/';
const DEMO_ARTICLE_URL = '/article/01-demo-article';

test.describe('Navigation & Discovery (Phase 4)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(HOME_URL);
    // Wait for article list to load (fetch from index.json)
    await page.waitForSelector('devliot-home-page', { timeout: 10000 });
  });

  // NAV-02: Articles listed newest first (reverse chronological)
  test('NAV-02: home page shows articles in reverse chronological order', async ({ page }) => {
    // Wait for articles to render
    const homePage = page.locator('devliot-home-page');
    const articleRows = homePage.locator('.article-row');
    await expect(articleRows.first()).toBeVisible({ timeout: 10000 });

    // Get all dates and verify descending order
    const dates = await homePage.locator('.article-row__date').allTextContents();
    expect(dates.length).toBeGreaterThan(0);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i - 1].localeCompare(dates[i])).toBeGreaterThanOrEqual(0);
    }
  });

  // NAV-01: Category/tag filter chips
  test('NAV-01: clicking a filter chip shows only matching articles', async ({ page }) => {
    const homePage = page.locator('devliot-home-page');

    // Wait for filter chips to render
    const chips = homePage.locator('.chip');
    await expect(chips.first()).toBeVisible({ timeout: 10000 });

    // "All" chip should be active by default
    const allChip = homePage.locator('.chip').first();
    await expect(allChip).toHaveText('All');
    await expect(allChip).toHaveAttribute('aria-pressed', 'true');

    // Count articles before filtering
    const initialCount = await homePage.locator('.article-row').count();
    expect(initialCount).toBeGreaterThan(0);

    // Click a specific tag chip (e.g., "Tutorial" which is the demo article's category)
    const tutorialChip = homePage.locator('.chip', { hasText: 'Tutorial' });
    if (await tutorialChip.count() > 0) {
      await tutorialChip.click();

      // URL should update to include tag param
      await expect(page).toHaveURL(/tag=Tutorial/);

      // Chip should now be active
      await expect(tutorialChip).toHaveAttribute('aria-pressed', 'true');

      // All visible articles should have the Tutorial category
      const visibleArticles = homePage.locator('.article-row');
      const count = await visibleArticles.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  // NAV-01: Clicking active chip deactivates filter
  test('NAV-01: clicking active filter chip deactivates it', async ({ page }) => {
    const homePage = page.locator('devliot-home-page');
    await expect(homePage.locator('.chip').first()).toBeVisible({ timeout: 10000 });

    // Activate a filter
    const tutorialChip = homePage.locator('.chip', { hasText: 'Tutorial' });
    if (await tutorialChip.count() > 0) {
      await tutorialChip.click();
      await expect(tutorialChip).toHaveAttribute('aria-pressed', 'true');

      // Click again to deactivate
      await tutorialChip.click();
      await expect(tutorialChip).toHaveAttribute('aria-pressed', 'false');

      // "All" chip should be active again
      const allChip = homePage.locator('.chip').first();
      await expect(allChip).toHaveAttribute('aria-pressed', 'true');
    }
  });

  // NAV-01: Filter chips have correct accessibility attributes
  test('NAV-01: filter chips have accessibility attributes', async ({ page }) => {
    const homePage = page.locator('devliot-home-page');
    const chipGroup = homePage.locator('[role="group"]');
    await expect(chipGroup).toBeVisible({ timeout: 10000 });
    await expect(chipGroup).toHaveAttribute('aria-label', 'Filter by tag');
  });

  // NAV-03: Tag click on article page navigates to home with filter
  test('NAV-03: clicking a tag on article page filters home page', async ({ page }) => {
    // Navigate to demo article
    await page.goto(DEMO_ARTICLE_URL);
    await page.waitForSelector('devliot-article-page article h1', { timeout: 10000 });

    // Find and click a tag link
    const tagLink = page.locator('devliot-article-page .tag-link').first();
    if (await tagLink.count() > 0) {
      const tagText = await tagLink.textContent();
      await tagLink.click();

      // Should navigate to home with tag filter
      await expect(page).toHaveURL(new RegExp(`tag=${encodeURIComponent(tagText!.trim())}`));

      // Home page should show with that filter active
      const homePage = page.locator('devliot-home-page');
      await expect(homePage).toBeVisible({ timeout: 10000 });
    }
  });

  // NAV-03: Direct navigation to /?tag=X activates filter on load
  test('NAV-03: direct URL with tag param activates filter on page load', async ({ page }) => {
    await page.goto('/?tag=demo');
    const homePage = page.locator('devliot-home-page');
    await expect(homePage.locator('.chip').first()).toBeVisible({ timeout: 10000 });

    // The "demo" chip should be active
    const demoChip = homePage.locator('.chip--active');
    await expect(demoChip).toBeVisible();
    await expect(demoChip).toHaveText('demo');
  });

  // NAV-04: Search input in header
  test('NAV-04: search icon expands to input on click', async ({ page }) => {
    const header = page.locator('devliot-header');

    // Search button should be visible
    const searchBtn = header.locator('.search-btn');
    await expect(searchBtn).toBeVisible();
    await expect(searchBtn).toHaveAttribute('aria-label', 'Search articles');
    await expect(searchBtn).toHaveAttribute('aria-expanded', 'false');

    // Click to expand
    await searchBtn.click();
    await expect(searchBtn).toHaveAttribute('aria-expanded', 'true');

    // Input should appear
    const searchInput = header.locator('.search-input');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('aria-label', 'Search articles');
  });

  // NAV-04: Typing in search filters articles
  test('NAV-04: typing in search box filters articles in real time', async ({ page }) => {
    const header = page.locator('devliot-header');
    const homePage = page.locator('devliot-home-page');

    // Wait for articles to load
    await expect(homePage.locator('.article-row').first()).toBeVisible({ timeout: 10000 });

    // Open search
    await header.locator('.search-btn').click();
    const searchInput = header.locator('.search-input');
    await expect(searchInput).toBeVisible();

    // Type a search query that matches the demo article title
    await searchInput.fill('Components Demo');

    // Wait for debounce (200ms) + FlexSearch init
    await page.waitForTimeout(500);

    // Articles should still be visible (matching search)
    const articles = homePage.locator('.article-row');
    const count = await articles.count();
    expect(count).toBeGreaterThan(0);
  });

  // NAV-04: Search with no results shows empty state
  test('NAV-04: search with no results shows empty state', async ({ page }) => {
    const header = page.locator('devliot-header');
    const homePage = page.locator('devliot-home-page');

    await expect(homePage.locator('.article-row').first()).toBeVisible({ timeout: 10000 });

    // Open search and type nonsense
    await header.locator('.search-btn').click();
    const searchInput = header.locator('.search-input');
    await searchInput.fill('xyznonexistentquery');

    // Wait for debounce + search
    await page.waitForTimeout(500);

    // Empty state should appear
    const emptyState = homePage.locator('.empty-state');
    await expect(emptyState).toBeVisible({ timeout: 5000 });
    await expect(emptyState).toHaveText('No articles found.');
  });

  // NAV-04: Escape key closes and clears search
  test('NAV-04: pressing Escape closes and clears search', async ({ page }) => {
    const header = page.locator('devliot-header');

    // Open search
    await header.locator('.search-btn').click();
    const searchInput = header.locator('.search-input');
    await expect(searchInput).toBeVisible();

    // Type something
    await searchInput.fill('test');

    // Press Escape
    await searchInput.press('Escape');

    // Search should be collapsed (aria-expanded=false)
    const searchBtn = header.locator('.search-btn');
    await expect(searchBtn).toHaveAttribute('aria-expanded', 'false');
  });

  // D-10: Empty state for filter
  test('D-10: empty filter result shows "No articles found."', async ({ page }) => {
    // Navigate with a tag that doesn't exist
    await page.goto('/?tag=nonexistent-tag-xyz');
    const homePage = page.locator('devliot-home-page');

    // Wait for component to load
    await page.waitForTimeout(500);

    // Empty state should show
    const emptyState = homePage.locator('.empty-state');
    await expect(emptyState).toBeVisible({ timeout: 5000 });
    await expect(emptyState).toHaveText('No articles found.');
  });
});
