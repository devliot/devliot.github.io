// src/types/article.ts

/**
 * Shared author type, used for both article-level authors (AUTHOR-01)
 * and bibliography entry authors (D-08).
 */
export interface Author {
  name: string;
  url?: string;
}

/**
 * A single bibliography reference entry.
 *
 * Required fields: `id`, `type`, `title` (per D-05, D-10, D-11).
 * All other fields are optional (per D-06).
 *
 * `type` is a literal union — not a discriminated union (per D-10).
 * All optional fields are exposed on every type; which ones are
 * populated is a convention per type, not a TS constraint.
 */
export interface BibliographyEntry {
  /** Slug-style identifier, e.g. 'vaswani-2017'. Must match /^[a-z0-9-]+$/. */
  id: string;
  /** Determines rendering format in Phase 10. Exactly three values (per D-12). */
  type: 'article' | 'book' | 'web';
  title: string;
  authors?: Author[];
  url?: string;
  year?: number;
  publisher?: string;
  pages?: string;
  note?: string;
}

/**
 * An article entry in the article registry (public/articles/index.json).
 *
 * Fields beyond slug/title/date/category/tags are optional for
 * backward compatibility with v1.0 articles (per D-01, D-04).
 */
export interface Article {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  description?: string;
  image?: string;
  readingTime?: number;
  authors?: Author[];
  bibliography?: BibliographyEntry[];
}

/** Shape of public/articles/index.json */
export interface ArticleRegistry {
  articles: Article[];
}
