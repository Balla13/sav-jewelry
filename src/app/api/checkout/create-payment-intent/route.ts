import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/client";
import { getSettings } from "@/lib/supabase/settings";
import { computeShipping } from "@/lib/shipping";

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const {
      items,
      locale = "en",
      shipping_address,
      coupon_code,
      country_code,
    } = body as {
      items: { productId: string; quantity: number }[];
      locale?: "en" | "es";
      shipping_address?: Record<string, unknown> & { country?: string };
      coupon_code?: string;
      /** ISO country code (e.g. US). Used when shipping_address.country not set. */
      country_code?: string;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items required" }, { status: 400 });
    }

    const stripe = new Stripe(secret);
    const supabase = createClient();
    const settings = await getSettings();

    const normalized = items
      .map((i) => ({ productId: String(i.productId), quantity: Math.max(1, Math.floor(Number(i.quantity) || 1)) }))
      .filter((i) => !!i.productId);
    const ids = Array.from(new Set(normalized.map((i) => i.productId)));

    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, price_usd, free_shipping")
      .in("id", ids.filter((id) => id !== "cleaning-kit"));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const byId = new Map<string, { name: string; price_usd: number; free_shipping: boolean }>();
    (products || []).forEach((p: any) => {
      byId.set(String(p.id), {
        name: String(p.name || ""),
        price_usd: Number(p.price_usd) || 0,
        free_shipping: p.free_shipping === true,
      });
    });

    let subtotalCents = 0;
    let totalQuantity = 0;
    const lineItemsForOrder: { name: string; quantity: number; priceUsd: number }[] = [];
    for (const item of normalized) {
      if (item.productId === "cleaning-kit") {
        const kitPrice = 29;
        const itemTotal = Math.round(kitPrice * item.quantity * 100);
        subtotalCents += itemTotal;
        totalQuantity += item.quantity;
        lineItemsForOrder.push({
          name: "SÁV+ Jewelry Cleaning Kit",
          quantity: item.quantity,
          priceUsd: kitPrice,
        });
        continue;
      }
      const p = byId.get(item.productId);
      if (!p) continue;
      const itemTotal = Math.round(p.price_usd * item.quantity * 100);
      subtotalCents += itemTotal;
      totalQuantity += item.quantity;
      lineItemsForOrder.push({ name: p.name, quantity: item.quantity, priceUsd: p.price_usd });
    }
    if (subtotalCents <= 0) return NextResponse.json({ error: "No valid products" }, { status: 400 });

    const countryCode =
      (shipping_address?.country && String(shipping_address.country).trim()) ||
      (typeof country_code === "string" && country_code.trim()) ||
      "US";
    const shippingResult = computeShipping({
      countryCode,
      subtotalCents,
      totalQuantity,
      domesticFeeUsd: Number(settings.shipping_fee_usd) ?? 5,
      internationalFeeUsd: Number(settings.international_shipping_usd) ?? 35,
    });
    let totalCents = subtotalCents + shippingResult.shippingCents;

    let discountCents = 0;
    let couponLabel: string | null = null;
    if (coupon_code && String(coupon_code).trim()) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("code, type, value")
        .eq("code", String(coupon_code).trim().toUpperCase())
        .eq("active", true)
        .maybeSingle();
      if (coupon) {
        couponLabel = coupon.code;
        if (coupon.type === "percent") {
          const pct = Math.min(100, Math.max(0, Number(coupon.value) || 0));
          discountCents = Math.round((subtotalCents * pct) / 100);
        } else {
          discountCents = Math.min(subtotalCents, Math.round((Number(coupon.value) || 0) * 100));
        }
        totalCents = Math.max(0, totalCents - discountCents);
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        locale: locale === "es" ? "es" : "en",
        customer_email: (shipping_address as { email?: string } | undefined)?.email || "",
        shipping: JSON.stringify(shipping_address || {}),
        items: JSON.stringify(lineItemsForOrder),
        subtotal_usd: (subtotalCents / 100).toFixed(2),
        shipping_usd: shippingResult.shippingUsd.toFixed(2),
        shipping_international: String(shippingResult.isInternational),
        discount_usd: (discountCents / 100).toFixed(2),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      subtotal: subtotalCents / 100,
      shipping: shippingResult.shippingUsd,
      isInternational: shippingResult.isInternational,
      discount: discountCents / 100,
      total: totalCents / 100,
      couponApplied: !!couponLabel,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
