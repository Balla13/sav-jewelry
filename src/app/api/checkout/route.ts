import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/client";
import { getSettings } from "@/lib/supabase/settings";
import { computeShipping } from "@/lib/shipping";

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const {
      items,
      locale = "en",
      shipping_address,
    } = body as {
      items: { productId: string; quantity: number }[];
      locale?: "en" | "es";
      shipping_address?: { email?: string } & Record<string, unknown>;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items is required and must be a non-empty array." },
        { status: 400 }
      );
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
      .in("id", ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const byId = new Map<string, { id: string; name: string; price_usd: number; free_shipping: boolean | null }>();
    (products || []).forEach((p: any) => {
      byId.set(String(p.id), {
        id: String(p.id),
        name: String(p.name || ""),
        price_usd: Number(p.price_usd) || 0,
        free_shipping: p.free_shipping === true,
      });
    });

    let subtotalCents = 0;
    let totalQuantity = 0;
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    for (const item of normalized) {
      const p = byId.get(item.productId);
      if (!p) continue;
      const unitAmount = Math.max(0, Math.round((Number(p.price_usd) || 0) * 100));
      subtotalCents += unitAmount * item.quantity;
      totalQuantity += item.quantity;
      line_items.push({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: unitAmount,
          product_data: {
            name: p.name || "Product",
          },
        },
      });
    }

    if (line_items.length === 0) {
      return NextResponse.json({ error: "No valid products in cart." }, { status: 400 });
    }

    const rawCountry = shipping_address?.country;
    const countryCode =
      typeof rawCountry === "string" && rawCountry.trim() ? rawCountry.trim() : "US";
    const shippingResult = computeShipping({
      countryCode,
      subtotalCents,
      totalQuantity,
      domesticFeeUsd: Number(settings.shipping_fee_usd) ?? 5,
      internationalFeeUsd: Number(settings.international_shipping_usd) ?? 35,
    });
    if (shippingResult.shippingCents > 0) {
      line_items.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: shippingResult.shippingCents,
          product_data: {
            name: shippingResult.isInternational ? "International Shipping (Flat Rate)" : "Shipping",
          },
        },
      });
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      customer_email: shipping_address?.email,
      success_url: `${origin}/${locale}/checkout?success=1`,
      cancel_url: `${origin}/${locale}/checkout?canceled=1`,
      locale: locale === "es" ? "es" : "en",
      metadata: {
        locale: locale === "es" ? "es" : "en",
        cart: JSON.stringify(normalized.slice(0, 25)),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
