import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const SITE_URL = 'https://devliot.github.io';
const BASE_URL = '/devliot/';
const WPM = 238;
const SLUG_PATTERN = /^[a-zA-Z0-9_-]+$/;

/**
 * Escape HTML special characters to prevent XSS in generated OG HTML pages.
 * Escapes: & < > "
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Operation A: Compute reading time for each article and write back to index.json.
 * Reads each article's HTML, strips tags, counts words, computes ceil(words / WPM).
 */
function enrichIndexJson() {
  const indexPath = 'public/articles/index.json';
  const registry = JSON.parse(readFileSync(indexPath, 'utf8'));

  for (const article of registry.articles) {
    if (!SLUG_PATTERN.test(article.slug)) {
      console.warn(`Skipping article with invalid slug: "${article.slug}"`);
      continue;
    }

    const articleHtmlPath = `public/articles/${article.slug}/index.html`;
    if (!existsSync(articleHtmlPath)) {
      console.warn(`Article HTML not found: ${articleHtmlPath}, skipping reading time`);
      continue;
    }

    const html = readFileSync(articleHtmlPath, 'utf8');
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = text.split(' ').filter(w => w.length > 0).length;
    article.readingTime = Math.ceil(words / WPM);
  }

  writeFileSync(indexPath, JSON.stringify(registry, null, 2), 'utf8');
  console.log(`Enriched index.json: ${registry.articles.length} articles, readingTime computed`);
}

/**
 * Operation B: Generate per-article OG HTML pages into dist/.
 * Reads (now-enriched) index.json and writes dist/articles/{slug}/og.html for each article.
 */
function generateOgPages() {
  const registry = JSON.parse(readFileSync('public/articles/index.json', 'utf8'));
  let generated = 0;

  for (const article of registry.articles) {
    if (!SLUG_PATTERN.test(article.slug)) {
      console.warn(`Skipping OG page for invalid slug: "${article.slug}"`);
      continue;
    }

    const title = escapeHtml(article.title || '');
    const description = article.description ? escapeHtml(article.description) : '';
    const imageUrl = article.image
      ? `${SITE_URL}${BASE_URL}${article.image}`
      : '';
    const articleUrl = `${SITE_URL}${BASE_URL}#/article/${article.slug}`;
    const redirectUrl = `${BASE_URL}#/article/${article.slug}`;

    const descMeta = description
      ? `    <meta property="og:description" content="${description}" />\n`
      : '';
    const ogImageMeta = imageUrl
      ? `    <meta property="og:image" content="${imageUrl}" />\n`
      : '';
    const twitterDescMeta = description
      ? `    <meta name="twitter:description" content="${description}" />\n`
      : '';
    const twitterImageMeta = imageUrl
      ? `    <meta name="twitter:image" content="${imageUrl}" />\n`
      : '';

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
${descMeta}    <meta property="og:url" content="${articleUrl}" />
${ogImageMeta}    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
${twitterDescMeta}${twitterImageMeta}  <script>window.location.replace(${JSON.stringify(redirectUrl)});</script>
</head>
<body></body>
</html>
`;

    const outDir = `dist/articles/${article.slug}`;
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'og.html'), html, 'utf8');
    generated++;
  }

  console.log(`Generated OG pages: ${generated} articles in dist/`);
}

// CLI mode dispatch
const mode = process.argv[2];

if (mode === '--enrich' || !mode) {
  enrichIndexJson();
}
if (mode === '--generate' || !mode) {
  generateOgPages();
}
