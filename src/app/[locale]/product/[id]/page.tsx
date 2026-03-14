import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getProductByIdFromFile, getProductsFromFile } from "@/lib/products-server";
import { getSettings } from "@/lib/supabase/settings";
import ProductDetail from "@/components/ProductDetail";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function ProductPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [product, allProducts, settings] = await Promise.all([
    getProductByIdFromFile(id),
    getProductsFromFile(),
    getSettings(),
  ]);
  if (!product) notFound();

  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  return (
    <ProductDetail
      product={product}
      relatedProducts={relatedProducts}
      uniquePieceLabel={settings.unique_piece_label ?? undefined}
      shippingInsuredText={settings.shipping_insured_text ?? undefined}
    />
  );
}

export async function generateStaticParams() {
  const { getProductsFromFile } = await import("@/lib/products-server");
  const products = await getProductsFromFile();
  return products.map((p) => ({ id: p.id }));
}
