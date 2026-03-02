import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
      <h1 className="font-display text-4xl font-light tracking-tight text-noir-900 sm:text-5xl">
        {t("title")}
      </h1>
      <p className="mt-4 text-label font-medium uppercase tracking-widest text-gold">
        {t("subtitle")}
      </p>
      <p className="mt-10 text-base leading-relaxed text-noir-700">
        {t("content")}
      </p>
    </div>
  );
}
