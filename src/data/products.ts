export const PRODUCT_CATEGORIES = [
  "Vintage Metal",
  "Fine Jewelry",
  "Precious Stones",
  "Sterling Silver",
  "18k Gold",
  "Necklaces",
  "Rings",
  "Earrings",
  "Bracelets",
  "Rare Finds",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  image: string;
  images?: string[];
  variations?: string[];
  priceUsd: number;
  stockQuantity?: number;
  /** Se true, este produto não cobra frete (frete grátis). Se false, usa o frete fixo da loja. */
  freeShipping?: boolean;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Serenity Ring",
    category: "Rings",
    description:
      "A solitaire ring crafted in 18K white gold with a conflict-free brilliant diamond. Timeless design for everyday elegance.",
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800",
    images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800"],
    priceUsd: 2400,
    stockQuantity: 0,
  },
  {
    id: "2",
    name: "Pearl Drop Earrings",
    category: "Earrings",
    description:
      "South Sea cultured pearls suspended from delicate 14K gold hooks. Hand-selected for their luminous luster and perfect shape.",
    image: "https://images.unsplash.com/photo-1596944920632-2d2bca61b0e8?q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1596944920632-2d2bca61b0e8?q=80&w=800",
      "https://images.unsplash.com/photo-1515562143047-7f9ab5f37b17?q=80&w=800",
    ],
    priceUsd: 1850,
    stockQuantity: 0,
  },
  {
    id: "3",
    name: "Eternal Bracelet",
    category: "Necklaces",
    description:
      "A flexible bangle in 18K rose gold with a row of pavé diamonds. Secure clasp and a perfect fit for stacking or wearing alone.",
    image: "https://images.unsplash.com/photo-1611652022419-a941f46062e5?q=80&w=800",
    images: ["https://images.unsplash.com/photo-1611652022419-a941f46062e5?q=80&w=800"],
    priceUsd: 3200,
    stockQuantity: 0,
  },
  {
    id: "4",
    name: "Luna Pendant Necklace",
    category: "Necklaces",
    description:
      "A crescent moon pendant in sterling silver with a subtle rhodium finish. 18\" chain with an adjustable length. A symbol of renewal and grace.",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800",
    images: ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800"],
    priceUsd: 420,
    stockQuantity: 0,
  },
  {
    id: "5",
    name: "Marquise Diamond Ring",
    category: "Rings",
    description:
      "Marquise-cut diamond set in platinum with a slim band. The elongated shape elongates the finger and catches the light from every angle.",
    image: "https://images.unsplash.com/photo-1603561586110-d7d2f6966de2?q=80&w=800",
    images: ["https://images.unsplash.com/photo-1603561586110-d7d2f6966de2?q=80&w=800"],
    priceUsd: 5100,
    stockQuantity: 0,
  },
  {
    id: "6",
    name: "Hoop Earrings Small",
    category: "Earrings",
    description:
      "Classic hoops in 14K yellow gold, lightweight and comfortable for all-day wear. Diameter 22mm. A wardrobe essential.",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800",
      "https://images.unsplash.com/photo-1515562143047-7f9ab5f37b17?q=80&w=800",
    ],
    priceUsd: 680,
    stockQuantity: 0,
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
