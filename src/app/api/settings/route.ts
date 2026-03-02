import { NextResponse } from "next/server";
import { getSettings } from "@/lib/supabase/settings";

/** Public API: returns social links for the footer (no auth). */
export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
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
    });
  }
}
