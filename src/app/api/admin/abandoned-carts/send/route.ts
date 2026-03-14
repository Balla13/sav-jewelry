import { NextRequest, NextResponse } from "next/server";
import { createServerAdminClient } from "@/lib/supabase/server-admin";
import { getSettings } from "@/lib/supabase/settings";
import { sendAbandonedCartEmail } from "@/lib/resend";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://savjewelry.shop";

function isAuthorized(request: NextRequest) {
  const token =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    request.cookies.get("admin_token")?.value ||
    "";
  return !!ADMIN_PASSWORD && token === ADMIN_PASSWORD;
}

/** Reenvia e-mail de carrinho abandonado para uma sessão (admin). */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const id = body?.id;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const supabase = createServerAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { data: row, error: fetchErr } = await supabase
    .from("checkout_sessions")
    .select("id, email, items, locale, first_name, last_name, phone, address, city, state, zip_code, country_code")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !row) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  const items = Array.isArray(row.items) ? row.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "Cart has no items" }, { status: 400 });
  }

  const settings = await getSettings();
  const pathLocale = row.locale === "es" ? "es" : "en";
  const recoveryUrl = `${SITE_URL}/${pathLocale}/checkout?recover=${row.id}`;

  const err = await sendAbandonedCartEmail({
    to: row.email,
    items: items.map((i: { name?: string; quantity?: number; priceUsd?: number }) => ({
      name: i.name || "",
      quantity: i.quantity || 0,
      priceUsd: i.priceUsd || 0,
    })),
    locale: pathLocale as "en" | "es",
    logoUrl: settings.site_logo_url,
    recoveryUrl,
    shippingAddress:
      row.address || row.city || row.country_code
        ? {
            firstName: row.first_name ?? undefined,
            lastName: row.last_name ?? undefined,
            address: row.address ?? undefined,
            city: row.city ?? undefined,
            state: row.state ?? undefined,
            zipCode: row.zip_code ?? undefined,
            country: row.country_code ?? undefined,
          }
        : undefined,
  });

  if (err) return NextResponse.json({ error: err.error || "Failed to send email" }, { status: 500 });

  await supabase.from("checkout_sessions").update({ email_sent_at: new Date().toISOString() }).eq("id", id);
  return NextResponse.json({ ok: true, sent: true });
}
