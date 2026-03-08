"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { X, Minus, Plus, ShoppingBag, Plane } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCartStore } from "@/store/cart-store";
import { getProductById, formatPrice } from "@/data/products";
import type { Product } from "@/data/products";
import { useRef, useEffect, useState } from "react";
import { computeShipping, isDomestic } from "@/lib/shipping";

export default function CartDrawer() {
  const t = useTranslations("cart");
  const tCheckout = useTranslations("checkout");
  const locale = useLocale();
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [zipCode, setZipCode] = useState("");
  const [domesticFeeUsd, setDomesticFeeUsd] = useState(5);
  const [internationalFeeUsd, setInternationalFeeUsd] = useState(35);
  const shippingCountry = useCartStore((s) => s.shippingCountry);
  const setShippingCountry = useCartStore((s) => s.setShippingCountry);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.shipping_fee_usd === "number" && data.shipping_fee_usd >= 0)
          setDomesticFeeUsd(data.shipping_fee_usd);
        if (typeof data?.international_shipping_usd === "number" && data.international_shipping_usd >= 0)
          setInternationalFeeUsd(data.international_shipping_usd);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, closeCart]);

  const lineItems = items
    .map((item) => {
      const product: Product | null = item.snapshot
        ? {
            id: item.productId,
            name: item.snapshot.name,
            description: "",
            category: "Rings",
            image: item.snapshot.image,
            priceUsd: item.snapshot.priceUsd,
            freeShipping: item.snapshot.freeShipping ?? false,
          }
        : getProductById(item.productId) ?? null;
      return product ? { product, quantity: item.quantity } : null;
    })
    .filter(Boolean) as { product: Product; quantity: number }[];

  const subtotal = lineItems.reduce((acc, { product, quantity }) => acc + product.priceUsd * quantity, 0);
  const totalQuantity = lineItems.reduce((acc, { quantity }) => acc + quantity, 0);
  const countryCode = (shippingCountry || "US").trim().toUpperCase();
  const cartShippingResult = computeShipping({
    countryCode,
    subtotalCents: Math.round(subtotal * 100),
    totalQuantity,
    domesticFeeUsd,
    internationalFeeUsd,
  });
  const total = subtotal + cartShippingResult.shippingUsd;

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-noir-900/40 backdrop-blur-sm transition-opacity"
        aria-hidden
        onClick={closeCart}
      />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("title")}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl sm:w-[400px]"
      >
        <div className="flex items-center justify-between border-b border-champagne-200 px-4 py-4 sm:px-6">
          <h2 className="font-display text-lg font-semibold text-noir-900">
            {t("title")}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-full p-2.5 text-noir-600 transition hover:bg-noir-900/5 hover:text-noir-900 hover:shadow-lg"
            aria-label={t("close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {lineItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="h-14 w-14 text-champagne-300" />
              <p className="mt-4 font-medium text-noir-700">{t("empty")}</p>
              <Link
                href="/collection"
                onClick={closeCart}
                className="mt-4 text-sm font-medium text-noir-900 underline hover:no-underline"
              >
                {t("continueShopping")}
              </Link>
            </div>
          ) : (
            <ul className="space-y-6">
              {lineItems.map(({ product, quantity }) => (
                <li
                  key={product.id}
                  className="flex gap-4 border-b border-champagne-200 pb-6 last:border-0"
                >
                  <div className="relative aspect-square h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-champagne-200">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover object-center"
                      sizes="96px"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-medium text-noir-900">
                      {product.name}
                    </h3>
                    <p className="mt-0.5 text-sm text-noir-600">
                      {formatPrice(product.priceUsd)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(product.id, quantity - 1)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-champagne-300 text-noir-700 hover:bg-champagne-200"
                        aria-label={t("decreaseQuantity")}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[1.5rem] text-center text-sm font-medium">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(product.id, quantity + 1)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-champagne-300 text-noir-700 hover:bg-champagne-200"
                        aria-label={t("increaseQuantity")}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(product.id)}
                        className="ml-2 text-xs text-noir-500 underline hover:text-noir-800"
                      >
                        {t("remove")}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lineItems.length > 0 && (
          <div className="border-t border-champagne-200 px-4 py-4 sm:px-6 space-y-4">
            <div>
              <label htmlFor="cart-country" className="mb-1 block text-sm font-medium text-noir-700">
                {locale === "es" ? "País" : "Country"}
              </label>
              <select
                id="cart-country"
                value={["US", "CA", "GB", "MX", "BR", "OTHER"].includes(countryCode) ? countryCode : "OTHER"}
                onChange={(e) => setShippingCountry(e.target.value)}
                className="w-full rounded-2xl border border-champagne-300 bg-white px-4 py-2.5 text-noir-900 focus:border-noir-900 focus:outline-none focus:ring-1 focus:ring-noir-900"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="MX">Mexico</option>
                <option value="BR">Brazil</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="cart-zip" className="mb-1 block text-sm font-medium text-noir-700">
                {t("zipCode")}
              </label>
              <input
                id="cart-zip"
                type="text"
                inputMode="numeric"
                placeholder={t("zipPlaceholder")}
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="w-full rounded-2xl border border-champagne-300 bg-white px-4 py-2.5 text-noir-900 placeholder:text-noir-400 focus:border-noir-900 focus:outline-none focus:ring-1 focus:ring-noir-900"
              />
            </div>
            <AnimatePresence initial={false}>
              {zipCode.trim().length >= 5 && isDomestic(countryCode) && (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2 overflow-hidden text-sm text-noir-600"
                >
                  <Plane className="h-4 w-4 flex-shrink-0 text-gold" aria-hidden />
                  {t("shippingNote")}
                </motion.p>
              )}
            </AnimatePresence>
            {isDomestic(countryCode) && (
              <FreeShippingProgress total={subtotal} totalQuantity={totalQuantity} />
            )}
            {!isDomestic(countryCode) && (
              <p className="text-xs text-noir-600">
                {locale === "es"
                  ? `Envío internacional (tarifa fija): ${formatPrice(cartShippingResult.shippingUsd)}`
                  : `International Shipping (Flat Rate): ${formatPrice(cartShippingResult.shippingUsd)}`}
              </p>
            )}
            <div className="flex items-center justify-between text-sm text-noir-600">
              <span>{t("subtotal")}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-noir-600">
              <span>
                {cartShippingResult.isInternational
                  ? tCheckout("internationalShippingLabel")
                  : "Shipping"}
              </span>
              <span>
                {cartShippingResult.isFreeShipping ? t("free") : formatPrice(cartShippingResult.shippingUsd)}
              </span>
            </div>
            <div className="flex items-center justify-between text-base font-medium text-noir-900">
              <span>{tCheckout("total")}</span>
              <span>{formatPrice(total)}</span>
            </div>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="mt-4 block w-full rounded-full bg-noir-900 py-3.5 text-center text-sm font-medium text-champagne-50 transition hover:bg-noir-800 hover:shadow-lg"
            >
              {t("checkout")}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

type FreeShippingProgressProps = {
  total: number;
  totalQuantity: number;
};

function FreeShippingProgress({ total, totalQuantity }: FreeShippingProgressProps) {
  const t = useTranslations("cart");
  const goalAmount = 299;
  const needsItem = totalQuantity < 2;
  const needsAmount = total < goalAmount;
  const missingAmount = Math.max(0, goalAmount - total);
  const quantityProgress = Math.min(1, totalQuantity / 2);
  const amountProgress = Math.min(1, total / goalAmount);
  const progress = Math.min(1, Math.max(quantityProgress, amountProgress));
  const percentage = Math.round(progress * 100);

  const message =
    progress >= 1
      ? t("freeShippingUnlocked", { amount: formatPrice(goalAmount) })
      : t("freeShippingGoal", { amount: formatPrice(missingAmount || goalAmount - total) });

  return (
    <div className="space-y-2 rounded-2xl border border-champagne-200 bg-section px-3 py-3">
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/80">
        <div
          className="h-full rounded-full bg-noir-900 transition-all"
          style={{ width: `${Math.max(8, percentage)}%` }}
        />
      </div>
      <p className="text-xs text-noir-700">{message}</p>
      <p className="text-[11px] uppercase tracking-[0.18em] text-noir-400">
        {needsItem || needsAmount ? "Free shipping on 2+ items or orders over $299" : "Free shipping unlocked"}
      </p>
    </div>
  );
}
