import { readFileSync, writeFileSync } from 'fs';

const registry = JSON.parse(readFileSync('public/articles/index.json', 'utf8'));
const searchData = registry.articles.map(article => {
  const html = readFileSync(`public/articles/${article.slug}/index.html`, 'utf8');
  const body = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return {
    slug: article.slug,
    title: article.title,
    date: article.date,
    category: article.category,
    tags: article.tags,
    body,
  };
});

writeFileSync('public/search-data.json', JSON.stringify(searchData), 'utf8');
console.log(`Built search-data.json: ${searchData.length} articles indexed`);
