import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

/** Salva sessão de checkout (email + itens) para possível e-mail de carrinho abandonado após 2h. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, items, locale } = body as {
      email: string;
      items: { name: string; quantity: number; priceUsd: number }[];
      locale?: string;
    };
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    const supabase = createClient();
    const { error } = await supabase.from("checkout_sessions").insert({
      email: email.trim().toLowerCase(),
      items: Array.isArray(items) ? items : [],
      locale: locale === "es" ? "es" : "en",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }
}
