import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { getPosts } from "@/lib/blog";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/data/blog-types";

const SITE = "https://savjewelry.shop";

type Props = { params: Promise<{ locale: string }> };

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const posts = getPosts(locale as Locale);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="mb-16 border-b border-noir-900/10 pb-12">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-noir-900 md:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 text-lg text-noir-600">{t("subtitle")}</p>
        </header>

        <ul className="space-y-12">
          {posts.map((post) => (
            <li key={`${post.id}-${post.locale}`}>
              <article>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
                >
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-noir-900 transition group-hover:text-gold md:text-3xl">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-base text-noir-600">{post.description}</p>
                  <time
                    dateTime={post.datePublished}
                    className="mt-2 block text-label uppercase tracking-widest text-noir-400"
                  >
                    {new Date(post.datePublished).toLocaleDateString(locale, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  <span className="mt-2 inline-block text-sm font-medium text-noir-700 group-hover:text-gold">
                    {t("readMore")} →
                  </span>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return {
    title: "Journal | SÁV+ Jewelry",
    description:
      "Essays on vintage jewelry, craftsmanship, and timeless style. Luxury and estate jewelry insights.",
    alternates: {
      canonical: `${SITE}/${locale}/blog`,
      languages: {
        "x-default": `${SITE}/en/blog`,
        en: `${SITE}/en/blog`,
        es: `${SITE}/es/blog`,
      },
    },
    openGraph: {
      title: "Journal | SÁV+ Jewelry",
      description: "Essays on vintage jewelry, craftsmanship, and timeless style.",
      url: `${SITE}/${locale}/blog`,
    },
  };
}

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "es" }];
}
