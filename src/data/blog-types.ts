/**
 * Blog post structure for bilingual SEO content (EN/ES).
 * Each theme has two entries: one for "en" and one for "es", linked by shared `id`.
 */

export type BlogBlockType = "h2" | "h3" | "p";

export interface BlogBlock {
  type: BlogBlockType;
  text: string;
}

export interface BlogFAQ {
  question: string;
  answer: string;
}

export interface BlogPost {
  /** Shared theme id for hreflang alternates (same for EN and ES version) */
  id: string;
  locale: "en" | "es";
  slug: string;
  title: string;
  description: string;
  datePublished: string; // ISO
  dateModified: string;
  /** Body blocks in order (H2, H3, paragraphs). Min 500 words total. */
  body: BlogBlock[];
  /** Paragraph indices (0-based) after which to show a CTA link to /shop */
  ctaAfterParagraphs: number[];
  faq: BlogFAQ[];
}

export type Locale = "en" | "es";
