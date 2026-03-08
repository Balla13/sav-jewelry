import type { BlogPost, Locale } from "@/data/blog-types";
import { getAllPosts } from "@/data/blog-posts";

export function getPosts(locale: Locale): BlogPost[] {
  return getAllPosts().filter((p) => p.locale === locale);
}

/** Get the N most recent posts for a locale (by datePublished desc). */
export function getLatestPosts(locale: Locale, limit: number): BlogPost[] {
  return getPosts(locale)
    .sort((a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime())
    .slice(0, limit);
}

export function getPost(locale: Locale, slug: string): BlogPost | undefined {
  return getAllPosts().find((p) => p.locale === locale && p.slug === slug);
}

/** Get the slug of the same article in another locale (for hreflang). */
export function getAlternateSlug(postId: string, locale: Locale): string | null {
  const post = getAllPosts().find((p) => p.id === postId && p.locale === locale);
  return post?.slug ?? null;
}

export function getPostById(id: string, locale: Locale): BlogPost | undefined {
  return getAllPosts().find((p) => p.id === id && p.locale === locale);
}

/** Count words in all body blocks. */
export function countWords(post: BlogPost): number {
  return post.body.reduce((acc, b) => acc + b.text.trim().split(/\s+/).filter(Boolean).length, 0);
}
