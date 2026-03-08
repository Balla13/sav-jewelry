import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getLatestPosts } from "@/lib/blog";
import type { Locale } from "@/data/blog-types";
import FadeInUp from "@/components/FadeInUp";

type Props = { locale: Locale };

function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

export default async function LatestFromBlog({ locale }: Props) {
  const t = await getTranslations("blog");
  const posts = getLatestPosts(locale, 3);

  if (posts.length === 0) return null;

  return (
    <section className="border-t border-noir-900/5 bg-section py-20 sm:py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <FadeInUp>
          <div className="text-center">
            <h2 className="font-display text-4xl font-light tracking-tight text-noir-900 sm:text-5xl">
              {t("latestTitle")}
            </h2>
            <p className="mt-4 text-sm uppercase tracking-widest text-noir-500">
              {t("subtitle")}
            </p>
          </div>
        </FadeInUp>

        <ul className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-3 lg:mt-20">
          {posts.map((post, i) => (
            <FadeInUp key={post.id} delay={i * 0.08}>
              <li className="flex flex-col border-b border-noir-900/10 pb-8">
                <time
                  dateTime={post.datePublished}
                  className="text-xs uppercase tracking-widest text-noir-500"
                >
                  {formatDate(post.datePublished, locale)}
                </time>
                <h3 className="mt-2 font-display text-xl font-light tracking-tight text-noir-900 sm:text-2xl">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="hover:text-gold focus:text-gold transition-colors"
                  >
                    {post.title}
                  </Link>
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-noir-600">
                  {post.description}
                </p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-4 inline-block text-sm font-medium uppercase tracking-widest text-noir-700 transition hover:text-gold focus:text-gold"
                >
                  {t("readMore")}
                </Link>
              </li>
            </FadeInUp>
          ))}
        </ul>

        <FadeInUp delay={0.2}>
          <div className="mt-12 text-center lg:mt-16">
            <Link
              href="/blog"
              className="inline-flex items-center rounded-full border border-noir-900 bg-white px-8 py-3 text-label font-medium uppercase tracking-widest text-noir-900 transition hover:border-gold hover:text-gold hover:shadow-lg"
            >
              {t("viewAllPosts")}
            </Link>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
