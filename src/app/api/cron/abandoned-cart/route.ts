import { NextRequest, NextResponse } from "next/server";
import { createServerAdminClient } from "@/lib/supabase/server-admin";
import { getSettings } from "@/lib/supabase/settings";
import { sendAbandonedCartEmail } from "@/lib/resend";

const CRON_SECRET = process.env.CRON_SECRET;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://savjewelry.shop";

/** Chamar a cada 15–30 min (ex.: Vercel Cron). Envia e-mail de carrinho abandonado para sessões com mais de 2h. */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = request.nextUrl.searchParams.get("secret");
  const ok = CRON_SECRET ? auth === `Bearer ${CRON_SECRET}` || secret === CRON_SECRET : true;
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60).toISOString();
  const { data: sessions, error } = await supabase
    .from("checkout_sessions")
    .select("id, email, items, locale, first_name, last_name, phone, address, city, state, zip_code, country_code")
    .is("email_sent_at", null)
    .lt("created_at", twoHoursAgo);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!sessions?.length) {
    return NextResponse.json({ sent: 0 });
  }

  const settings = await getSettings();
  const logoUrl = settings.site_logo_url;
  let sent = 0;

  for (const row of sessions) {
    const items = Array.isArray(row.items) ? row.items : [];
    if (items.length === 0) continue;
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
      logoUrl,
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
    if (!err) {
      await supabase.from("checkout_sessions").update({ email_sent_at: new Date().toISOString() }).eq("id", row.id);
      sent++;
    }
  }
  return NextResponse.json({ sent });
}
