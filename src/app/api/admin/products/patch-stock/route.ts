import { NextRequest, NextResponse } from "next/server";
import { createServerAdminClient } from "@/lib/supabase/server-admin";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Ipaper123!";

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "") || request.cookies.get("admin_token")?.value;
  return token === ADMIN_PASSWORD;
}

export async function PATCH(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { id, stock_quantity } = body as { id: string; stock_quantity: number };
    if (!id || typeof stock_quantity !== "number" || stock_quantity < 0) {
      return NextResponse.json({ error: "Invalid id or stock_quantity" }, { status: 400 });
    }
    const supabase = createServerAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not set" }, { status: 500 });
    }
    const { error } = await supabase
      .from("products")
      .update({ stock_quantity: Math.floor(stock_quantity), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update stock" }, { status: 500 });
  }
}
