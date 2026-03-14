import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerAdminClient } from "@/lib/supabase/server-admin";
import { getSettings } from "@/lib/supabase/settings";
import { sendOrderConfirmation } from "@/lib/resend";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeSecret || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecret);
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (e) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Checkout transparente (PaymentIntent) ou redirect (Checkout Session)
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const supabase = createServerAdminClient();
    if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("stripe_payment_intent_id", paymentIntent.id)
      .maybeSingle();
    if (existing?.id) return NextResponse.json({ ok: true, duplicate: true });

    const meta = paymentIntent.metadata || {};
    const locale = meta.locale === "es" ? "es" : "en";
    const email = meta.customer_email || "";
    let items: { name: string; quantity: number; priceUsd: number }[] = [];
    try {
      items = JSON.parse(meta.items || "[]");
    } catch {
      items = [];
    }
    const subtotalUsd = parseFloat(meta.subtotal_usd || "0") || 0;
    const shippingUsd = parseFloat(meta.shipping_usd || "0") || 0;
    const totalUsd = (paymentIntent.amount_received || 0) / 100;
    let shippingAddress: Record<string, unknown> = {};
    try {
      shippingAddress = JSON.parse(meta.shipping || "{}");
    } catch {
      shippingAddress = {};
    }
    if (email) (shippingAddress as Record<string, unknown>).email = email;

    const { error: insertError } = await supabase.from("orders").insert({
      user_id: null,
      status: "payment_approved",
      total: totalUsd,
      currency: "USD",
      stripe_payment_intent_id: paymentIntent.id,
      items,
      shipping_address: shippingAddress,
    });
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    if (email && items.length > 0) {
      const settings = await getSettings();
    const addr = shippingAddress as Record<string, unknown>;
    const get = (a: string, b: string) => (addr?.[a] ?? addr?.[b]) as string | undefined;
    await sendOrderConfirmation({
      to: email,
      items,
      subtotal: subtotalUsd,
      shipping: shippingUsd,
      total: totalUsd,
      locale,
      logoUrl: settings.site_logo_url,
      shippingAddress: addr && (addr.firstName ?? addr.first_name ?? addr.address ?? addr.city)
        ? {
            firstName: get("firstName", "first_name"),
            lastName: get("lastName", "last_name"),
            address: get("address", "address"),
            city: get("city", "city"),
            state: get("state", "state"),
            zipCode: get("zipCode", "zip_code"),
            country: get("country", "country"),
          }
        : undefined,
    });
    }
    return NextResponse.json({ ok: true });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const sessionId = session.id;
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
  const locale = session.metadata?.locale === "es" ? "es" : "en";

  const supabase = createServerAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });
  }

  // Idempotência (webhook pode ser reenviado)
  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  if (existing?.id) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // Monta itens do e-mail e do order a partir do Stripe (line items).
  const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 });
  const items = (lineItems.data || [])
    .filter((li) => (li.description || "").toLowerCase() !== "shipping")
    .map((li) => ({
      name: li.description || "Product",
      quantity: li.quantity || 1,
      priceUsd: ((li.price?.unit_amount || 0) / 100) || 0,
    }));

  const shippingItem = (lineItems.data || []).find((li) => (li.description || "").toLowerCase() === "shipping");
  const shippingUsd = shippingItem ? (shippingItem.amount_total || 0) / 100 : 0;
  const subtotalUsd = (lineItems.data || [])
    .filter((li) => (li.description || "").toLowerCase() !== "shipping")
    .reduce((sum, li) => sum + (li.amount_total || 0) / 100, 0);
  const totalUsd = (session.amount_total || 0) / 100;

  const email =
    session.customer_details?.email ||
    (typeof session.customer_email === "string" ? session.customer_email : null);

  const shipping_address = {
    email: email || null,
    name: session.customer_details?.name || null,
    phone: session.customer_details?.phone || null,
    address: session.customer_details?.address || null,
  };

  const { error: insertError } = await supabase.from("orders").insert({
    user_id: null,
    status: "payment_approved",
    total: Number(totalUsd),
    currency: "USD",
    stripe_session_id: sessionId,
    stripe_payment_intent_id: paymentIntentId,
    items,
    shipping_address,
  });
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  if (email) {
    const settings = await getSettings();
    const addr = session.customer_details?.address;
    await sendOrderConfirmation({
      to: email,
      items,
      subtotal: subtotalUsd,
      shipping: shippingUsd,
      total: totalUsd,
      locale,
      logoUrl: settings.site_logo_url,
      shippingAddress:
        addr || session.customer_details?.name
          ? {
              firstName: session.customer_details?.name?.split(" ")[0],
              lastName: session.customer_details?.name?.split(" ").slice(1).join(" "),
              address: addr?.line1 ? [addr.line1, addr.line2].filter(Boolean).join(", ") : undefined,
              city: addr?.city,
              state: addr?.state,
              zipCode: addr?.postal_code,
              country: addr?.country,
            }
          : undefined,
    });
  }

  return NextResponse.json({ ok: true });
}

