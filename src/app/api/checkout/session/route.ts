import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

type SessionItem = { productId?: string; name: string; quantity: number; priceUsd: number };

/** Salva ou atualiza sessão de checkout (email, endereço, itens) para e-mail de carrinho abandonado e link de recuperação. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id: sessionId,
      email,
      items,
      locale,
      first_name,
      last_name,
      phone,
      address,
      city,
      state,
      zip_code,
      country_code,
    } = body as {
      id?: string;
      email?: string;
      items?: SessionItem[];
      locale?: string;
      first_name?: string;
      last_name?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      zip_code?: string;
      country_code?: string;
    };

    const supabase = createClient();

    if (sessionId && typeof sessionId === "string") {
      const { data: existing, error: fetchErr } = await supabase
        .from("checkout_sessions")
        .select("id")
        .eq("id", sessionId)
        .maybeSingle();
      if (!fetchErr && existing) {
        const { error: updateErr } = await supabase
          .from("checkout_sessions")
          .update({
            ...(email != null && { email: String(email).trim().toLowerCase() }),
            ...(Array.isArray(items) && { items }),
            ...(locale === "es" && { locale: "es" }),
            ...(locale === "en" && { locale: "en" }),
            ...(first_name !== undefined && { first_name: first_name ? String(first_name).trim() : null }),
            ...(last_name !== undefined && { last_name: last_name ? String(last_name).trim() : null }),
            ...(phone !== undefined && { phone: phone ? String(phone).trim() : null }),
            ...(address !== undefined && { address: address ? String(address).trim() : null }),
            ...(city !== undefined && { city: city ? String(city).trim() : null }),
            ...(state !== undefined && { state: state ? String(state).trim() : null }),
            ...(zip_code !== undefined && { zip_code: zip_code ? String(zip_code).trim() : null }),
            ...(country_code !== undefined && { country_code: country_code ? String(country_code).trim() : null }),
          })
          .eq("id", sessionId);
        if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
        return NextResponse.json({ ok: true, id: sessionId });
      }
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const { data: inserted, error } = await supabase
      .from("checkout_sessions")
      .insert({
        email: email.trim().toLowerCase(),
        items: Array.isArray(items) ? items : [],
        locale: locale === "es" ? "es" : "en",
        first_name: first_name ? String(first_name).trim() : null,
        last_name: last_name ? String(last_name).trim() : null,
        phone: phone ? String(phone).trim() : null,
        address: address ? String(address).trim() : null,
        city: city ? String(city).trim() : null,
        state: state ? String(state).trim() : null,
        zip_code: zip_code ? String(zip_code).trim() : null,
        country_code: country_code ? String(country_code).trim() : null,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: inserted?.id });
  } catch (e) {
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }
}
