import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, source } = body as { email?: string; source?: string };
    const value = (email || "").trim().toLowerCase();
    if (!value || !value.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    const supabase = createClient();
    const { error } = await supabase
      .from("contacts")
      .upsert(
        {
          email: value,
          source: (source || "exit-intent").slice(0, 64),
        },
        { onConflict: "email,source" }
      );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to save contact" }, { status: 500 });
  }
}

