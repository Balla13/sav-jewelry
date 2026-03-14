import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

/** Retorna a sessão de checkout por id para restaurar o carrinho (link de recuperação). */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("checkout_sessions")
    .select("id, items, locale")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Cart not found" }, { status: 404 });

  const items = Array.isArray(data.items) ? data.items : [];
  const cart = items
    .filter((i: { productId?: string }) => i.productId)
    .map((i: { productId: string; name?: string; quantity?: number; priceUsd?: number; image?: string }) => ({
      productId: i.productId,
      quantity: Math.max(1, Number(i.quantity) || 1),
      name: i.name || "",
      priceUsd: Number(i.priceUsd) || 0,
      image: i.image || "",
    }));

  return NextResponse.json({
    id: data.id,
    locale: data.locale === "es" ? "es" : "en",
    items: cart,
  });
}
