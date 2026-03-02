import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export default async function ShippingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal.shipping");

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:px-8 lg:py-24">
      <Link
        href="/"
        className="text-label font-medium uppercase tracking-widest text-noir-500 hover:text-noir-900"
      >
        ← Back
      </Link>
      <article className="mt-10 rounded-2xl border border-noir-900/5 bg-section p-8 sm:p-10 lg:p-12">
        <h1 className="font-display text-4xl font-light tracking-tight text-noir-900 sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-6 text-base leading-relaxed text-noir-700">
          {t("intro")}
        </p>
        <div className="mt-8 space-y-6 border-t border-noir-900/10 pt-8">
          <p className="text-base leading-relaxed text-noir-700">{t("p1")}</p>
          <p className="text-base leading-relaxed text-noir-700">{t("p2")}</p>
          <p className="text-base leading-relaxed text-noir-700">{t("p3")}</p>
        </div>
      </article>
    </div>
  );
}
