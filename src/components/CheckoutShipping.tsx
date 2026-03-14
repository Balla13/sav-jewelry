"use client";

import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Plane } from "lucide-react";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useCartStore } from "@/store/cart-store";
import { getProductById, formatPrice } from "@/data/products";
import type { Product } from "@/data/products";
import CheckoutPaymentForm from "@/components/CheckoutPaymentForm";
import { computeShipping, isDomestic } from "@/lib/shipping";
import {
  isPostalLookupSupported,
  normalizePostal,
  getMinLength,
  fetchPostalLookup,
} from "@/lib/postal-code-lookup";
import { resolveOrderBumpImageSrc } from "@/lib/order-bump-image";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

const inputClass =
  "w-full rounded-2xl border border-champagne-300 bg-white px-5 py-3.5 text-noir-900 placeholder:text-noir-400 focus:border-noir-900 focus:outline-none focus:ring-1 focus:ring-noir-900";

export default function CheckoutShipping() {
  const t = useTranslations("cart");
  const tCheckout = useTranslations("checkout");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("success") === "1";
  const [zipCode, setZipCode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [shippingFeeUsd, setShippingFeeUsd] = useState(5);
  const [internationalShippingUsd, setInternationalShippingUsd] = useState(35);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [previewAmounts, setPreviewAmounts] = useState<{
    subtotal: number;
    shipping: number;
    discount: number;
    total: number;
    couponApplied: boolean;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentAmounts, setPaymentAmounts] = useState<{
    subtotal: number;
    shipping: number;
    discount: number;
    total: number;
    couponApplied: boolean;
  } | null>(null);

  const clearCart = useCartStore((s) => s.clearCart);
  const items = useCartStore((s) => s.items);
  const shippingCountry = useCartStore((s) => s.shippingCountry);
  const setShippingCountry = useCartStore((s) => s.setShippingCountry);
  const [includeCleaningKit, setIncludeCleaningKit] = useState(false);
  const [kitEnabled, setKitEnabled] = useState(true);
  const [kitName, setKitName] = useState("SÁV+ Jewelry Cleaning Kit");
  const [kitDescription, setKitDescription] = useState(
    "Keep your pieces radiant with our signature revival formula."
  );
  const [kitImageUrl, setKitImageUrl] = useState("/Limpa Joias SAV.png");
  const [kitPriceState, setKitPriceState] = useState(29);
  const [kitComparePriceState, setKitComparePriceState] = useState(49);
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
  const baseSubtotal = lineItems.reduce((acc, { product, quantity }) => acc + product.priceUsd * quantity, 0);
  const baseQuantity = lineItems.reduce((acc, { quantity }) => acc + quantity, 0);
  const kitPrice = kitPriceState;
  const kitComparePrice = kitComparePriceState;
  const withKit = includeCleaningKit && kitEnabled;
  const subtotal = withKit ? baseSubtotal + kitPrice : baseSubtotal;
  const totalQuantity = withKit ? baseQuantity + 1 : baseQuantity;
  const countryCode = (shippingCountry || "US").trim().toUpperCase();
  const shippingResult = computeShipping({
    countryCode,
    subtotalCents: Math.round(subtotal * 100),
    totalQuantity,
    domesticFeeUsd: shippingFeeUsd,
    internationalFeeUsd: internationalShippingUsd,
  });
  const shipping = shippingResult.shippingUsd;
  const total = subtotal + shipping;
  const qualifiesFreeShipping = shippingResult.isFreeShipping;

  useEffect(() => {
    if (isSuccess) clearCart();
  }, [isSuccess, clearCart]);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const fee = data?.shipping_fee_usd;
        if (typeof fee === "number" && fee >= 0) setShippingFeeUsd(fee);
        const intlFee = data?.international_shipping_usd;
        if (typeof intlFee === "number" && intlFee >= 0) setInternationalShippingUsd(intlFee);
        if (typeof data?.order_bump_enabled === "boolean") setKitEnabled(data.order_bump_enabled);
        if (data?.order_bump_name) setKitName(data.order_bump_name);
        if (data?.order_bump_description) setKitDescription(data.order_bump_description);
        if (data?.order_bump_price_usd != null && !Number.isNaN(Number(data.order_bump_price_usd))) {
          setKitPriceState(Number(data.order_bump_price_usd));
        }
        if (
          data?.order_bump_compare_at_price_usd != null &&
          !Number.isNaN(Number(data.order_bump_compare_at_price_usd))
        ) {
          setKitComparePriceState(Number(data.order_bump_compare_at_price_usd));
        }
        if (data?.order_bump_image_url) setKitImageUrl(data.order_bump_image_url);
      })
      .catch(() => {});
  }, []);

  const saveCheckoutSession = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = (e.target.value || "").trim();
    if (!value || !value.includes("@") || lineItems.length === 0) return;
    const sessionItems = lineItems.map(({ product, quantity }) => ({
      name: product.name,
      quantity,
      priceUsd: product.priceUsd,
    }));
    if (withKit) {
      sessionItems.push({
        name: "SÁV+ Jewelry Cleaning Kit",
        quantity: 1,
        priceUsd: kitPrice,
      });
    }
    fetch("/api/checkout/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: value,
        items: sessionItems,
        locale: locale === "es" ? "es" : "en",
      }),
    }).catch(() => {});
  };

  // Auto-fill city, state (and street for Brazil) from postal code for supported countries
  useEffect(() => {
    if (!isPostalLookupSupported(countryCode)) return;
    const normalized = normalizePostal(countryCode, zipCode);
    const minLen = getMinLength(countryCode);
    if (!normalized || normalized.length < minLen) return;
    let cancelled = false;
    fetchPostalLookup(countryCode, normalized)
      .then((result) => {
        if (cancelled || !result) return;
        setCity(result.city);
        setState(result.state);
        if (result.street) setAddress(result.street);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [zipCode, countryCode]);

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripePublishableKey) {
      alert(
        "Pagamento não configurado. Adicione NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY no arquivo .env.local e reinicie o servidor (npm run dev)."
      );
      return;
    }
    try {
      const res = await fetch("/api/checkout/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            ...lineItems.map(({ product, quantity }) => ({ productId: product.id, quantity })),
            ...(withKit ? [{ productId: "cleaning-kit", quantity: 1 }] : []),
          ],
          locale: locale as "en" | "es",
          coupon_code: (appliedCoupon || couponCode).trim() || undefined,
          shipping_address: {
            email,
            firstName,
            lastName,
            country: countryCode,
            zipCode,
            address,
            city,
            state,
          },
          country_code: countryCode,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Checkout failed");
        return;
      }
      if (data?.clientSecret) {
        setPaymentAmounts({
          subtotal: data.subtotal ?? subtotal,
          shipping: data.shipping ?? shipping,
          discount: data.discount ?? 0,
          total: data.total ?? total,
          couponApplied: !!data.couponApplied,
        });
        setClientSecret(data.clientSecret);
        return;
      }
      alert("Checkout failed");
    } catch (err) {
      console.error("Checkout failed:", err);
      alert("Checkout failed");
    }
  };

  if (isSuccess) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28 text-center">
        <h1 className="font-display text-4xl font-light tracking-tight text-noir-900 sm:text-5xl">
          Thank you
        </h1>
        <p className="mt-4 text-noir-600">
          Your order has been confirmed. We&apos;ll send you an email with the details.
        </p>
        <Link
          href="/collection"
          className="mt-8 inline-block rounded-full border border-noir-900 bg-noir-900 px-6 py-3 text-sm font-medium text-champagne-50 hover:bg-noir-800"
        >
          {tCheckout("backToCollection")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
      <Link
        href="/collection"
        className="mb-8 inline-block text-label font-medium uppercase tracking-widest text-noir-500 hover:text-noir-900"
      >
        {tCheckout("backToCollection")}
      </Link>

      <h1 className="font-display text-4xl font-light tracking-tight text-noir-900 sm:text-5xl">
        {tCheckout("checkout")}
      </h1>

      <form onSubmit={handlePayNow} className="mt-10 lg:mt-14">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:gap-x-20">
          <div className="space-y-6">
            <div>
              <label htmlFor="checkout-email" className="mb-2 block text-sm font-medium text-noir-700">
                {tCheckout("email")} *
              </label>
              <input
                id="checkout-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={saveCheckoutSession}
                className={inputClass}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkout-firstName" className="mb-2 block text-sm font-medium text-noir-700">
                  {tCheckout("firstName")} *
                </label>
                <input
                  id="checkout-firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                  placeholder="First name"
                  required
                />
              </div>
              <div>
                <label htmlFor="checkout-lastName" className="mb-2 block text-sm font-medium text-noir-700">
                  {tCheckout("lastName")} *
                </label>
                <input
                  id="checkout-lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClass}
                  placeholder="Last name"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="checkout-country" className="mb-2 block text-sm font-medium text-noir-700">
                {tCheckout("country")} *
              </label>
              <select
                id="checkout-country"
                value={countryCode}
                onChange={(e) => setShippingCountry(e.target.value)}
                className={inputClass}
                required
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
                <option value="MX">Mexico</option>
                <option value="BR">Brazil</option>
                <option value="ES">Spain</option>
                <option value="FR">France</option>
                <option value="DE">Germany</option>
                <option value="IT">Italy</option>
                <option value="AU">Australia</option>
                <option value="PT">Portugal</option>
                <option value="AR">Argentina</option>
                <option value="CO">Colombia</option>
                <option value="CL">Chile</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            {!isDomestic(countryCode) && (
              <p className="rounded-2xl border border-gold/40 bg-gold/5 px-4 py-3 text-sm text-noir-700">
                {tCheckout("internationalShippingMessage", { amount: formatPrice(internationalShippingUsd) })}
              </p>
            )}
            <div className="rounded-2xl border-2 border-gold/60 bg-gold/5 px-4 py-3 ring-2 ring-gold/30">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gold/90">
                {tCheckout("zipCodeStart")}
              </p>
              <label htmlFor="checkout-zip" className="mb-2 block text-sm font-medium text-noir-700">
                {t("zipCode")} {isDomestic(countryCode) ? "*" : ""}
              </label>
              <input
                id="checkout-zip"
                type="text"
                inputMode={countryCode === "US" || countryCode === "MX" || countryCode === "BR" ? "numeric" : "text"}
                placeholder={
                  countryCode === "BR"
                    ? "CEP (8 dígitos)"
                    : countryCode === "CA"
                      ? "A1A 1A1"
                      : countryCode === "US"
                        ? t("zipPlaceholder")
                        : "Postal code"
                }
                value={zipCode}
                onChange={(e) => {
                  const v = e.target.value;
                  if (countryCode === "US") setZipCode(v.replace(/\D/g, "").slice(0, 5));
                  else if (countryCode === "MX" || countryCode === "DE" || countryCode === "FR" || countryCode === "ES" || countryCode === "IT") setZipCode(v.replace(/\D/g, "").slice(0, 5));
                  else if (countryCode === "BR") setZipCode(v.replace(/\D/g, "").slice(0, 8));
                  else if (countryCode === "PT") setZipCode(v.replace(/\D/g, "").slice(0, 7));
                  else setZipCode(v.slice(0, 12));
                }}
                className={inputClass}
                required
              />
              <AnimatePresence initial={false}>
                {isPostalLookupSupported(countryCode) &&
                  zipCode.trim().length >= getMinLength(countryCode) && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-3 flex items-center gap-2 overflow-hidden text-sm text-noir-600"
                    >
                      <Plane className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                      {countryCode === "US"
                        ? t("shippingNote")
                        : countryCode === "BR"
                          ? locale === "es"
                            ? "Ciudad, estado y calle se completan automáticamente."
                            : "City, state and street filled automatically."
                          : locale === "es"
                            ? "Ciudad y estado se completan automáticamente."
                            : "City and state filled automatically."}
                    </motion.p>
                  )}
              </AnimatePresence>
            </div>
            <div>
              <label htmlFor="checkout-address" className="mb-2 block text-sm font-medium text-noir-700">
                {tCheckout("address")} *
              </label>
              <input
                id="checkout-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClass}
                placeholder="Street, number"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="checkout-city" className="mb-2 block text-sm font-medium text-noir-700">
                  {tCheckout("city")} *
                </label>
                <input
                  id="checkout-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClass}
                  placeholder="City"
                  required
                />
              </div>
              <div>
                <label htmlFor="checkout-state" className="mb-2 block text-sm font-medium text-noir-700">
                  {tCheckout("state")} *
                </label>
                <input
                  id="checkout-state"
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className={inputClass}
                  placeholder="State"
                  required
                />
              </div>
            </div>
          </div>

          <div className="mt-12 lg:mt-0">
            <div className="rounded-2xl border border-noir-900/10 bg-section p-6 sm:p-8">
              <h2 className="font-display text-xl font-light tracking-tight text-noir-900">
                {tCheckout("orderSummary")}
              </h2>

              <ul className="mt-6 space-y-4">
                {lineItems.map(({ product, quantity }) => (
                  <li key={product.id} className="flex gap-4">
                    <div className="relative aspect-square h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-white">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover object-center"
                        sizes="80px"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-medium text-noir-900">{product.name}</p>
                      <p className="mt-0.5 text-sm text-noir-600">
                        {quantity} × {formatPrice(product.priceUsd)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {kitEnabled && !clientSecret && (
                <div className="mt-4 rounded-2xl border border-noir-900/10 bg-white p-4 sm:p-5">
                  <div className="flex gap-3">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-section sm:h-24 sm:w-24">
                      <Image
                        src={resolveOrderBumpImageSrc(kitImageUrl) || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect fill='%23f0f0f0' width='64' height='64'/%3E%3C/svg%3E"}
                        alt={kitName}
                        fill
                        className="object-cover object-center"
                        sizes="64px"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-noir-500">
                        Exclusive offer
                      </p>
                      <p className="mt-1 font-display text-sm font-medium text-noir-900">
                        SÁV+ Jewelry Cleaning Kit
                      </p>
                      <p className="mt-0.5 text-xs text-noir-600">
                        Keep your pieces radiant with our signature revival formula.
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-right">
                        <p className="text-xs font-medium text-noir-400 line-through">
                          {formatPrice(kitComparePrice)}
                        </p>
                        <p className="font-display text-base font-semibold text-noir-900">
                          {formatPrice(kitPrice)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-noir-700">
                    <input
                      type="checkbox"
                      checked={includeCleaningKit}
                      onChange={(e) => setIncludeCleaningKit(e.target.checked)}
                      className="h-4 w-4 rounded border-champagne-300 text-noir-900 focus:ring-noir-900"
                    />
                    <span>Add this cleaning kit to my order</span>
                  </label>
                </div>
              )}

              {!clientSecret && (
                <>
                  <div className="mt-4">
                    <label htmlFor="checkout-coupon" className="block text-xs font-medium text-noir-600">
                      Coupon code
                    </label>
                    <div className="mt-1 flex gap-2">
                      <input
                        id="checkout-coupon"
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          setCouponError(null);
                          if (!e.target.value.trim()) {
                            setAppliedCoupon(null);
                            setPreviewAmounts(null);
                          }
                        }}
                        placeholder="WELCOME10"
                        className="flex-1 rounded-xl border border-champagne-300 px-3 py-2 text-noir-900"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const code = couponCode.trim();
                          if (!code) {
                            setCouponError("Enter a coupon code");
                            return;
                          }
                          setApplyingCoupon(true);
                          setCouponError(null);
                          try {
                            const res = await fetch("/api/checkout/preview", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                items: [
                                  ...lineItems.map(({ product, quantity }) => ({ productId: product.id, quantity })),
                                  ...(withKit ? [{ productId: "cleaning-kit", quantity: 1 }] : []),
                                ],
                                coupon_code: code,
                                country_code: countryCode,
                              }),
                            });
                            const data = await res.json().catch(() => ({}));
                            if (!res.ok) {
                              setPreviewAmounts(null);
                              setAppliedCoupon(null);
                              setCouponError(data.error || "Invalid coupon");
                              return;
                            }
                            setPreviewAmounts({
                              subtotal: data.subtotal ?? subtotal,
                              shipping: data.shipping ?? shipping,
                              discount: data.discount ?? 0,
                              total: data.total ?? total,
                              couponApplied: !!data.couponApplied,
                            });
                            setAppliedCoupon(data.couponApplied ? code : null);
                            if (!data.couponApplied) setCouponError("Invalid or inactive coupon");
                          } finally {
                            setApplyingCoupon(false);
                          }
                        }}
                        disabled={applyingCoupon || !lineItems.length}
                        className="shrink-0 rounded-xl border border-noir-900 bg-noir-900 px-4 py-2 text-sm font-medium text-champagne-50 transition hover:bg-noir-800 disabled:opacity-60"
                      >
                        {applyingCoupon ? "..." : "Apply"}
                      </button>
                    </div>
                    {appliedCoupon && (
                      <p className="mt-1.5 text-sm text-green-700">Coupon {appliedCoupon} applied.</p>
                    )}
                    {couponError && !appliedCoupon && (
                      <p className="mt-1.5 text-sm text-red-600">{couponError}</p>
                    )}
                  </div>
                  <div className="mt-6 space-y-2 border-t border-noir-900/10 pt-6">
                    <div className="flex items-center justify-between text-base text-noir-700">
                      <span>{t("subtotal")}</span>
                      <span>{formatPrice(previewAmounts?.subtotal ?? subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-base text-noir-700">
                      <span>
                        {shippingResult.isInternational
                          ? `${tCheckout("internationalShippingLabel")}:`
                          : tCheckout("standardShipping")}
                      </span>
                      <span>
                        {previewAmounts
                          ? formatPrice(previewAmounts.shipping)
                          : qualifiesFreeShipping
                            ? t("free")
                            : formatPrice(shipping)}
                      </span>
                    </div>
                    {(previewAmounts?.discount ?? 0) > 0 && (
                      <div className="flex items-center justify-between text-base text-green-700">
                        <span>Discount</span>
                        <span>-{formatPrice(previewAmounts!.discount)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-base font-medium text-noir-900 pt-2">
                      <span>{tCheckout("total")}</span>
                      <span>{formatPrice(previewAmounts?.total ?? total)}</span>
                    </div>
                  </div>
                  <div className="mt-8">
                    <button
                      type="submit"
                      className="w-full rounded-full border border-noir-900 bg-noir-900 px-6 py-4 text-sm font-medium text-champagne-50 transition hover:bg-noir-800 hover:shadow-lg"
                    >
                      {tCheckout("payNow")}
                    </button>
                  </div>
                </>
              )}
              {clientSecret && paymentAmounts && stripePromise && (
                <>
                  <div className="mt-6 space-y-2 border-t border-noir-900/10 pt-6">
                    <div className="flex items-center justify-between text-base text-noir-700">
                      <span>{t("subtotal")}</span>
                      <span>{formatPrice(paymentAmounts.subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-base text-noir-700">
                      <span>
                        {shippingResult.isInternational
                          ? `${tCheckout("internationalShippingLabel")}:`
                          : tCheckout("standardShipping")}
                      </span>
                      <span>{formatPrice(paymentAmounts.shipping)}</span>
                    </div>
                    {paymentAmounts.discount > 0 && (
                      <div className="flex items-center justify-between text-base text-green-700">
                        <span>Discount</span>
                        <span>-{formatPrice(paymentAmounts.discount)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-base font-medium text-noir-900 pt-2">
                      <span>{tCheckout("total")}</span>
                      <span>{formatPrice(paymentAmounts.total)}</span>
                    </div>
                  </div>
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutPaymentForm
                      onSuccess={() => {
                        if (typeof window === "undefined") return;
                        const url = new URL(window.location.href);
                        url.searchParams.set("success", "1");
                        window.location.href = url.toString();
                      }}
                      onCancel={() => {
                        setClientSecret(null);
                        setPaymentAmounts(null);
                      }}
                    />
                  </Elements>
                </>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
