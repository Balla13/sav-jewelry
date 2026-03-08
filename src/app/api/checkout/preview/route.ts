import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getSettings } from "@/lib/supabase/settings";
import { computeShipping } from "@/lib/shipping";

/** POST: returns subtotal, shipping, discount, total (no PaymentIntent). Uses country for domestic vs international. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, coupon_code, country_code } = body as {
      items: { productId: string; quantity: number }[];
      coupon_code?: string;
      /** ISO country code (e.g. US). Default US. */
      country_code?: string;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items required" }, { status: 400 });
    }

    const countryCode = typeof country_code === "string" ? country_code.trim() || "US" : "US";
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
    (products || []).forEach((p: { id: string; name: string; price_usd: number; free_shipping: boolean }) => {
      byId.set(String(p.id), {
        name: String(p.name || ""),
        price_usd: Number(p.price_usd) || 0,
        free_shipping: p.free_shipping === true,
      });
    });

    let subtotalCents = 0;
    let totalQuantity = 0;
    for (const item of normalized) {
      if (item.productId === "cleaning-kit") {
        subtotalCents += Math.round(29 * item.quantity * 100);
        totalQuantity += item.quantity;
        continue;
      }
      const p = byId.get(item.productId);
      if (!p) continue;
      subtotalCents += Math.round(p.price_usd * item.quantity * 100);
      totalQuantity += item.quantity;
    }
    if (subtotalCents <= 0) return NextResponse.json({ error: "No valid products" }, { status: 400 });

    const shippingResult = computeShipping({
      countryCode,
      subtotalCents,
      totalQuantity,
      domesticFeeUsd: Number(settings.shipping_fee_usd) ?? 5,
      internationalFeeUsd: Number(settings.international_shipping_usd) ?? 35,
    });
    let totalCents = subtotalCents + shippingResult.shippingCents;

    let discountCents = 0;
    let couponApplied = false;
    if (coupon_code && String(coupon_code).trim()) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("code, type, value")
        .eq("code", String(coupon_code).trim().toUpperCase())
        .eq("active", true)
        .maybeSingle();
      if (coupon) {
        couponApplied = true;
        if (coupon.type === "percent") {
          const pct = Math.min(100, Math.max(0, Number(coupon.value) || 0));
          discountCents = Math.round((subtotalCents * pct) / 100);
        } else {
          discountCents = Math.min(subtotalCents, Math.round((Number(coupon.value) || 0) * 100));
        }
        totalCents = Math.max(0, totalCents - discountCents);
      }
    }

    return NextResponse.json({
      subtotal: subtotalCents / 100,
      shipping: shippingResult.shippingUsd,
      shippingCents: shippingResult.shippingCents,
      isInternational: shippingResult.isInternational,
      isFreeShipping: shippingResult.isFreeShipping,
      discount: discountCents / 100,
      total: totalCents / 100,
      couponApplied,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Preview failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
