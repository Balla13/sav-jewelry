import type { BlogPost } from "./blog-types";

export const BLOG_NOW = "2025-03-01";

export function createBlogPost(
  id: string,
  locale: "en" | "es",
  slug: string,
  title: string,
  description: string,
  body: BlogPost["body"],
  ctaAfterParagraphs: number[],
  faq: BlogPost["faq"]
): BlogPost {
  return {
    id,
    locale,
    slug,
    title,
    description,
    datePublished: BLOG_NOW,
    dateModified: BLOG_NOW,
    body,
    ctaAfterParagraphs,
    faq,
  };
}
