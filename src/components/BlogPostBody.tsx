import { Link } from "@/i18n/navigation";
import type { BlogBlock, BlogPost } from "@/data/blog-types";

type Props = {
  post: BlogPost;
};

const CTA_EN = "Explore our curated collection of vintage and estate jewelry.";
const CTA_ES = "Explora nuestra colección curada de joyería vintage y de herencia.";

export default function BlogPostBody({ post }: Props) {
  const { body, ctaAfterParagraphs, locale } = post;
  const ctaText = locale === "es" ? CTA_ES : CTA_EN;
  let paragraphIndex = -1;

  return (
    <article className="prose prose-noir max-w-none">
      {body.map((block, i) => {
        if (block.type === "p") paragraphIndex++;

        const content = (
          <>
            {block.type === "h2" && (
              <h2 className="font-display mt-12 text-2xl font-semibold tracking-tight text-noir-900 first:mt-0 md:text-3xl">
                {block.text}
              </h2>
            )}
            {block.type === "h3" && (
              <h3 className="font-display mt-8 text-xl font-semibold tracking-tight text-noir-900 md:text-2xl">
                {block.text}
              </h3>
            )}
            {block.type === "p" && (
              <p className="mt-4 text-base leading-relaxed text-noir-700 md:text-lg">
                {block.text}
              </p>
            )}
            {block.type === "p" && ctaAfterParagraphs.includes(paragraphIndex) && (
              <p className="mt-4 text-base font-medium text-noir-900 md:text-lg">
                {ctaText}{" "}
                <Link
                  href="/collection"
                  className="border-b border-gold font-medium text-noir-900 hover:border-gold-dark hover:text-noir-900"
                >
                  {locale === "es" ? "Ver colección" : "Shop the collection"}
                </Link>
                .
              </p>
            )}
          </>
        );
        return <div key={i}>{content}</div>;
      })}
    </article>
  );
}
