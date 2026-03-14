import { NextRequest, NextResponse } from "next/server";
import { createServerAdminClient } from "@/lib/supabase/server-admin";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

function isAuthorized(request: NextRequest) {
  const token =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    request.cookies.get("admin_token")?.value ||
    "";
  return !!ADMIN_PASSWORD && token === ADMIN_PASSWORD;
}

/** Lista carrinhos abandonados (checkout_sessions) para o dashboard admin. */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("checkout_sessions")
    .select("id, email, first_name, last_name, phone, address, city, state, zip_code, country_code, items, locale, created_at, email_sent_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ carts: data || [] });
}
