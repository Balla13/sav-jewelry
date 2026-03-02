import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { getProductByIdFromFile } from "@/lib/products-server";
import { getSettings } from "@/lib/supabase/settings";
import ProductDetail from "@/components/ProductDetail";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ locale: string; id: string }> };

export default async function ProductPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [product, settings] = await Promise.all([getProductByIdFromFile(id), getSettings()]);
  if (!product) notFound();

  return (
    <ProductDetail
      product={product}
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
