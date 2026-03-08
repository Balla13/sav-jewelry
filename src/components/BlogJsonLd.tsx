import type { BlogPost } from "@/data/blog-types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://savjewelry.shop";

type Props = {
  post: BlogPost;
  locale: string;
};

export default function BlogJsonLd({ post, locale }: Props) {
  const postUrl = `${SITE}/${locale}/blog/${post.slug}`;

  const blogPosting = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    author: {
      "@type": "Organization",
      name: "SÁV+ Jewelry",
      url: SITE,
    },
    publisher: {
      "@type": "Organization",
      name: "SÁV+ Jewelry",
      url: SITE,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    url: postUrl,
    inLanguage: locale === "es" ? "es" : "en",
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPosting) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
    </>
  );
}
