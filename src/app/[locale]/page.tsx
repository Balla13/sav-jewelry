import { setRequestLocale } from "next-intl/server";
import { getProductsFromFile } from "@/lib/products-server";
import Hero from "@/components/Hero";
import FeaturedCollection from "@/components/FeaturedCollection";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  let products: Awaited<ReturnType<typeof getProductsFromFile>> = [];
  try {
    products = await getProductsFromFile();
  } catch {
    products = [];
  }
  const featured = Array.isArray(products) ? products.slice(0, 3) : [];

  return (
    <>
      <Hero />
      <FeaturedCollection products={featured} />
    </>
  );
}
