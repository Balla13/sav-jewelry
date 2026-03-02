"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { ArrowLeft, Star, ShoppingBag, Truck } from "lucide-react";
import type { Product } from "@/data/products";
import { formatPrice } from "@/data/products";
import { useCartStore } from "@/store/cart-store";

/** Adds N business days (skips weekends). */
function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}

type Props = {
  product: Product;
  uniquePieceLabel?: string;
  shippingInsuredText?: string;
};

export default function ProductDetail({ product, uniquePieceLabel, shippingInsuredText }: Props) {
  const t = useTranslations("product");
  const tCart = useTranslations("cart");
  const tReviews = useTranslations("reviews");
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const allImages = (product.images && product.images.length > 0 ? product.images : [product.image]).filter(Boolean);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const mainImage = allImages[selectedIndex] || product.image;
  const thumbnails = allImages.slice(0, 4);
  const showComparePrice = product.compareAtPriceUsd != null && product.compareAtPriceUsd > product.priceUsd;
  const locale = useLocale();
  const shipsByDate = useMemo(() => {
    const date = addBusinessDays(new Date(), 5);
    return date.toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, [locale]);

  const handleAddToCart = () => {
    addItem(product.id, 1, {
      name: product.name,
      priceUsd: product.priceUsd,
      image: product.image,
      freeShipping: product.freeShipping ?? false,
    });
    openCart();
  };

  const reviews = [
    { nameKey: "reviewer1" as const, textKey: "review1" as const },
    { nameKey: "reviewer2" as const, textKey: "review2" as const },
    { nameKey: "reviewer3" as const, textKey: "review3" as const },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12">
        <Link
          href="/collection"
          className="mb-10 inline-flex items-center gap-2 text-label font-medium uppercase tracking-widest text-noir-500 hover:text-noir-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("backToCollection")}
        </Link>

        {/* Fotos (esq) + Nome, preço, botão carrinho (dir) */}
        <div className="lg:flex lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:w-1/2 lg:shrink-0">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-section">
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                unoptimized
              />
            </div>
            {thumbnails.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {thumbnails.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedIndex(i)}
                    className={`relative aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition sm:h-24 sm:w-24 ${
                      selectedIndex === i ? "border-noir-900" : "border-transparent hover:border-noir-900/30"
                    }`}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      className="object-cover object-center"
                      sizes="96px"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-12 flex flex-col lg:mt-0 lg:w-1/2 lg:py-4">
            <h1 className="font-display text-4xl font-light tracking-tight text-noir-900 sm:text-5xl">
              {product.name}
            </h1>
            {uniquePieceLabel && (
              <span className="mt-4 inline-block rounded-full bg-noir-900 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-white">
                {uniquePieceLabel}
              </span>
            )}
            {product.variations && product.variations.length > 0 && (
              <p className="mt-4 text-label uppercase tracking-widest text-noir-500">
                {product.variations.join(" · ")}
              </p>
            )}

            <div className="mt-10">
              <p className="text-label font-medium uppercase tracking-widest text-noir-500">
                {t("priceLabel")}
              </p>
              <div className="mt-3 flex flex-wrap items-baseline gap-3">
                {showComparePrice && (
                  <span className="text-lg font-display font-medium text-noir-400 line-through">
                    {formatPrice(product.compareAtPriceUsd!)}
                  </span>
                )}
                <p className="text-2xl font-display font-semibold text-noir-900">
                  {formatPrice(product.priceUsd)}
                </p>
              </div>
            </div>

            {shippingInsuredText && (
              <p className="mt-4 text-sm text-noir-600">
                {shippingInsuredText}
              </p>
            )}

            <div className="mt-6 rounded-2xl border border-noir-900/10 bg-noir-50/50 px-4 py-4">
              <p className="text-label font-medium uppercase tracking-widest text-noir-500">
                {t("shipsBy")}
              </p>
              <p className="mt-1 font-display text-noir-900 capitalize">
                {shipsByDate}
              </p>
              <p className="mt-3 flex items-center gap-2 text-sm text-noir-700">
                <Truck className="h-4 w-4 shrink-0 text-noir-500" aria-hidden />
                {t("shippingAndReturns")}
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="mt-10 inline-flex w-full items-center justify-center gap-2 rounded-full border border-noir-900 bg-noir-900 py-4 text-label font-medium uppercase tracking-widest text-white transition hover:bg-noir-800 hover:shadow-lg sm:w-auto sm:px-10"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden />
              {tCart("addToCart")}
            </button>
          </div>
        </div>

        {/* Descrição abaixo das fotos e do botão; desktop: descrição à esquerda, reviews à direita; mobile: descrição em cima, reviews embaixo */}
        <div className="mt-16 border-t border-noir-900/10 pt-12 lg:grid lg:grid-cols-2 lg:gap-12">
          <section className="lg:col-start-1">
            <h2 className="font-display text-xl font-medium text-noir-900">{t("description")}</h2>
            <p className="mt-4 text-base leading-relaxed text-noir-700">
              {product.description}
            </p>
          </section>
          <section className="mt-10 lg:col-start-2 lg:mt-0">
            <h2 className="font-display text-2xl font-light tracking-tight text-noir-900">
              {tReviews("title")}
            </h2>
            <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3 lg:grid-cols-1">
              {reviews.map((r) => (
                <li key={r.nameKey} className="rounded-2xl border-t border-noir-900/10 pt-6">
                  <div className="flex gap-0.5 text-gold">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" aria-hidden />
                    ))}
                  </div>
                  <p className="mt-2 font-display italic text-noir-900">
                    {tReviews(r.nameKey)}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-noir-600">
                    {tReviews(r.textKey)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
