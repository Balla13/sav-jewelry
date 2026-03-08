import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getPost, getAlternateSlug } from "@/lib/blog";
import type { Locale } from "@/data/blog-types";
import BlogPostBody from "@/components/BlogPostBody";
import BlogShareBar from "@/components/BlogShareBar";
import BlogJsonLd from "@/components/BlogJsonLd";
import BlogFaqAccordion from "@/components/BlogFaqAccordion";
import { Link } from "@/i18n/navigation";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://savjewelry.shop";

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const post = getPost(locale as Locale, slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-white">
      <BlogJsonLd post={post} locale={locale} />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <nav className="mb-8">
          <Link
            href="/blog"
            className="text-label uppercase tracking-widest text-noir-500 hover:text-noir-900"
          >
            ← {t("backToBlog")}
          </Link>
        </nav>

        <header className="mb-12 border-b border-noir-900/10 pb-10">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-noir-900 md:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-noir-600">{post.description}</p>
          <time
            dateTime={post.datePublished}
            className="mt-4 block text-label uppercase tracking-widest text-noir-400"
          >
            {new Date(post.datePublished).toLocaleDateString(locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </header>

        <BlogPostBody post={post} />

        <section className="mt-14" aria-label="FAQ">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-noir-900">
            {locale === "es" ? "Preguntas frecuentes" : "Frequently Asked Questions"}
          </h2>
          <BlogFaqAccordion items={post.faq} />
        </section>

        <div className="mt-14">
          <BlogShareBar title={post.title} description={post.description} />
        </div>
      </div>
    </div>
  );
}

type MetadataProps = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: MetadataProps) {
  const { locale, slug } = await params;
  const post = getPost(locale as Locale, slug);
  if (!post) return { title: "Not Found" };

  const altEn = getAlternateSlug(post.id, "en");
  const altEs = getAlternateSlug(post.id, "es");
  const canonical = `${SITE}/${locale}/blog/${post.slug}`;

  const alternates: { canonical: string; languages?: Record<string, string> } = { canonical };
  if (altEn && altEs) {
    alternates.languages = {
      "x-default": `${SITE}/en/blog/${altEn}`,
      en: `${SITE}/en/blog/${altEn}`,
      es: `${SITE}/es/blog/${altEs}`,
    };
  }

  return {
    title: `${post.title} | SÁV+ Jewelry`,
    description: post.description,
    alternates,
    openGraph: {
      title: post.title,
      description: post.description,
      url: canonical,
      type: "article",
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified,
    },
  };
}

export async function generateStaticParams() {
  const { getPosts } = await import("@/lib/blog");
  const en = getPosts("en");
  const es = getPosts("es");
  const enParams = en.map((p) => ({ locale: "en", slug: p.slug }));
  const esParams = es.map((p) => ({ locale: "es", slug: p.slug }));
  return [...enParams, ...esParams];
}
