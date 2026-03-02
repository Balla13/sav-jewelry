import { NextResponse } from "next/server";
import { getSettings } from "@/lib/supabase/settings";

/** Public API: returns settings (footer, navbar, etc.). Sem cache para refletir alterações do admin na hora. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return NextResponse.json({
      instagram_url: null,
      facebook_url: null,
      contact_email: null,
      contact_phone: null,
      shipping_fee_usd: 5,
      site_logo_url: null,
      site_icon_url: null,
      home_hero_banner_desktop_url: null,
      home_hero_banner_mobile_url: null,
      meta_pixel_id: null,
      unique_piece_label: null,
      shipping_insured_text: null,
    });
  }
}
