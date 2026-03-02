import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { sendOrderConfirmation } from "@/lib/resend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, total, subtotal, shipping, shipping_address, locale } = body as {
      items: { productId: string; name: string; quantity: number; priceUsd: number }[];
      total: number;
      subtotal?: number;
      shipping?: number;
      shipping_address?: { email?: string } & Record<string, unknown>;
      locale?: "en" | "es";
    };

    if (!Array.isArray(items) || typeof total !== "number") {
      return NextResponse.json(
        { error: "Missing or invalid items / total" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: null,
        status: "pending",
        total: Number(total),
        currency: "USD",
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          priceUsd: i.priceUsd,
        })),
        shipping_address: shipping_address || null,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const email = shipping_address?.email;
    const sub = typeof subtotal === "number" ? subtotal : items.reduce((s, i) => s + i.priceUsd * i.quantity, 0);
    const ship = typeof shipping === "number" ? shipping : Math.max(0, total - sub);
    if (email && typeof email === "string") {
      await sendOrderConfirmation({
        to: email,
        items: items.map((i) => ({ name: i.name, quantity: i.quantity, priceUsd: i.priceUsd })),
        subtotal: sub,
        shipping: ship,
        total: Number(total),
        locale: locale === "es" ? "es" : "en",
      });
    }

    return NextResponse.json({ success: true, orderId: data?.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
