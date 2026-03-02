"use client";

import type { Product } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import FadeInUp from "@/components/FadeInUp";

type Props = { products: Product[] };

export default function ProductGrid({ products }: Props) {
  return (
    <ul className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product, i) => (
        <FadeInUp key={product.id} delay={i * 0.08}>
          <li className="flex">
            <ProductCard product={product} />
          </li>
        </FadeInUp>
      ))}
    </ul>
  );
}
