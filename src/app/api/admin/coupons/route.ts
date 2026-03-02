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
  if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 });
  const { data, error } = await supabase.from("coupons").select("id, code, type, value, active").order("code");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const code = String(body.code || "").trim().toUpperCase();
  const type = body.type === "fixed" ? "fixed" : "percent";
  const value = Math.max(0, Number(body.value) ?? 0);
  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });
  if (type === "percent" && value > 100) return NextResponse.json({ error: "Percent must be 0-100" }, { status: 400 });
  const supabase = createServerAdminClient();
  if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 });
  const { data, error } = await supabase
    .from("coupons")
    .insert({ code, type, value, active: true })
    .select("id, code, type, value")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const supabase = createServerAdminClient();
  if (!supabase) return NextResponse.json({ error: "Server error" }, { status: 500 });
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
