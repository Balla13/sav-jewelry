import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { getProductsFromFile } from "@/lib/products-server";
import ProductGrid from "@/components/ProductGrid";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
};

export default async function CollectionPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { category } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("collection");
  let products = await getProductsFromFile();
  if (category) {
    products = products.filter((p) => p.category === category);
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
      <header className="mb-16">
        <h1 className="font-display text-4xl font-light tracking-tight text-noir-900 sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-4 text-label uppercase tracking-widest text-noir-500">
          {t("count", { count: products.length })}
        </p>
      </header>
      <ProductGrid products={products} />
    </div>
  );
}
