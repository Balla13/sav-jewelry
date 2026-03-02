import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

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

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("contacts")
      .select("id, email, source, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch contacts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

