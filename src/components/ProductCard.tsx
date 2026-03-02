"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { Product } from "@/data/products";
import { formatPrice } from "@/data/products";
import { useCartStore } from "@/store/cart-store";
import { motion } from "framer-motion";

type Props = { product: Product };

export default function ProductCard({ product }: Props) {
  const [hover, setHover] = useState(false);
  const firstImage = product.images?.[0] ?? product.image ?? "";
  const secondImage = product.images?.[1] ?? firstImage;
  const showComparePrice = product.compareAtPriceUsd != null && product.compareAtPriceUsd > product.priceUsd;

  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex w-full flex-col overflow-hidden rounded-2xl bg-white transition hover:shadow-lg"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-section">
        {firstImage ? (
          <Image
            src={firstImage}
            alt={product.name}
            fill
            className="object-cover object-center transition duration-500 ease-out group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
          />
        ) : null}
        {firstImage && product.images && product.images.length > 1 && (
          <motion.div
            className="absolute inset-0 overflow-hidden"
            initial={false}
            animate={{ opacity: hover ? 1 : 0 }}
            transition={{ duration: 0.4 }}
          >
            <Image
              src={secondImage}
              alt=""
              fill
              className="object-cover object-center transition duration-500 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized
            />
          </motion.div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6 rounded-b-2xl">
        <h2 className="font-display text-xl font-light tracking-tight text-noir-900">
          {product.name}
        </h2>
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          {showComparePrice && (
            <span className="text-label font-medium uppercase tracking-widest text-noir-400 line-through">
              {formatPrice(product.compareAtPriceUsd!)}
            </span>
          )}
          <p className="text-label font-medium uppercase tracking-widest text-noir-700">
            {formatPrice(product.priceUsd)}
          </p>
        </div>
      </div>
    </Link>
  );
}
