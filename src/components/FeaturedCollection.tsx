"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import FadeInUp from "@/components/FadeInUp";

type Props = { products: Product[] };

export default function FeaturedCollection({ products }: Props) {
  const t = useTranslations("featured");

  return (
    <section className="border-t border-noir-900/5 bg-section py-20 sm:py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <FadeInUp>
          <div className="text-center">
            <h2 className="font-display text-4xl font-light tracking-tight text-noir-900 sm:text-5xl">
              {t("title")}
            </h2>
            <p className="mt-4 text-sm uppercase tracking-widest text-noir-500">
              {t("subtitle")}
            </p>
          </div>
        </FadeInUp>

        {products.length === 0 ? (
          <p className="mt-16 text-center text-sm uppercase tracking-widest text-noir-500 lg:mt-20">
            {t("empty")}
          </p>
        ) : (
          <ul className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3">
            {products.map((product, i) => (
              <FadeInUp key={product.id} delay={i * 0.08}>
                <li className="flex">
                  <ProductCard product={product} />
                </li>
              </FadeInUp>
            ))}
          </ul>
        )}

        <FadeInUp delay={0.2}>
          <div className="mt-12 text-center lg:mt-16">
            <Link
              href="/collection"
              className="inline-flex items-center rounded-full border border-noir-900 bg-white px-8 py-3 text-label font-medium uppercase tracking-widest text-noir-900 transition hover:border-gold hover:text-gold hover:shadow-lg"
            >
              {t("viewAll")}
            </Link>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
