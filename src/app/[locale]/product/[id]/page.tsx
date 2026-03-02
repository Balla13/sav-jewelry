import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getProductByIdFromFile } from "@/lib/products-server";
import ProductDetail from "@/components/ProductDetail";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function ProductPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const product = await getProductByIdFromFile(id);
  if (!product) notFound();

  return <ProductDetail product={product} />;
}

export async function generateStaticParams() {
  const { getProductsFromFile } = await import("@/lib/products-server");
  const products = await getProductsFromFile();
  return products.map((p) => ({ id: p.id }));
}
