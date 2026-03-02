import { NextResponse } from "next/server";
import { getSettings } from "@/lib/supabase/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSettings();
  const url = settings.site_icon_url || settings.site_logo_url;
  if (!url) {
    return new NextResponse(null, { status: 404 });
  }

  const res = await fetch(url);
  if (!res.ok) {
    return new NextResponse(null, { status: 404 });
  }

  const contentType = res.headers.get("content-type") || "image/png";
  const bytes = await res.arrayBuffer();
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=60",
    },
  });
}

