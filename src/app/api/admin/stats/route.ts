import { NextRequest, NextResponse } from "next/server";
import { createServerAdminClient } from "@/lib/supabase/server-admin";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Ipaper123!";

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "") || request.cookies.get("admin_token")?.value;
  return token === ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerAdminClient();
  if (!supabase) {
    return NextResponse.json({
      totalRevenue: 0,
      totalOrders: 0,
      topProducts: [],
      message: "Add SUPABASE_SERVICE_ROLE_KEY to .env.local for dashboard stats.",
    });
  }

  try {
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("total, items");
    if (ordersError) throw ordersError;

    const totalRevenue = (orders || []).reduce((sum, o) => sum + Number(o.total || 0), 0);
    const totalOrders = (orders || []).length;

    const quantityByProductId: Record<string, { name: string; quantity: number }> = {};
    for (const order of orders || []) {
      const items = (order.items as { productId?: string; name?: string; quantity?: number }[]) || [];
      for (const item of items) {
        const id = item.productId || "unknown";
        if (!quantityByProductId[id]) {
          quantityByProductId[id] = { name: item.name || id, quantity: 0 };
        }
        quantityByProductId[id].quantity += item.quantity || 0;
        if (item.name) quantityByProductId[id].name = item.name;
      }
    }

    const topProducts = Object.entries(quantityByProductId)
      .map(([productId, { name, quantity }]) => ({ productId, name, quantitySold: quantity }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);

    return NextResponse.json({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      topProducts,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
