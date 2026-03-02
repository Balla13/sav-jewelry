import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/supabase/settings";

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
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const {
      instagram_url,
      facebook_url,
      contact_email,
      contact_phone,
      shipping_fee_usd,
      site_logo_url,
      site_icon_url,
      home_hero_banner_desktop_url,
      home_hero_banner_mobile_url,
      meta_pixel_id,
      unique_piece_label,
      shipping_insured_text,
      order_bump_enabled,
      order_bump_name,
      order_bump_description,
      order_bump_price_usd,
      order_bump_compare_at_price_usd,
      order_bump_image_url,
    } = body as {
      instagram_url?: string;
      facebook_url?: string;
      contact_email?: string | null;
      contact_phone?: string | null;
      shipping_fee_usd?: number;
      site_logo_url?: string | null;
      site_icon_url?: string | null;
      home_hero_banner_desktop_url?: string | null;
      home_hero_banner_mobile_url?: string | null;
      meta_pixel_id?: string | null;
      unique_piece_label?: string | null;
      shipping_insured_text?: string | null;
      order_bump_enabled?: boolean;
      order_bump_name?: string | null;
      order_bump_description?: string | null;
      order_bump_price_usd?: number | null;
      order_bump_compare_at_price_usd?: number | null;
      order_bump_image_url?: string | null;
    };
    const result = await updateSettings({
      ...(instagram_url !== undefined && { instagram_url: instagram_url || null }),
      ...(facebook_url !== undefined && { facebook_url: facebook_url || null }),
      ...(contact_email !== undefined && { contact_email: contact_email || null }),
      ...(contact_phone !== undefined && { contact_phone: contact_phone || null }),
      ...(shipping_fee_usd !== undefined && { shipping_fee_usd: Number(shipping_fee_usd) }),
      ...(site_logo_url !== undefined && { site_logo_url: site_logo_url || null }),
      ...(site_icon_url !== undefined && { site_icon_url: site_icon_url || null }),
      ...(home_hero_banner_desktop_url !== undefined && { home_hero_banner_desktop_url: home_hero_banner_desktop_url || null }),
      ...(home_hero_banner_mobile_url !== undefined && { home_hero_banner_mobile_url: home_hero_banner_mobile_url || null }),
      ...(meta_pixel_id !== undefined && { meta_pixel_id: meta_pixel_id || null }),
      ...(unique_piece_label !== undefined && { unique_piece_label: unique_piece_label || null }),
      ...(shipping_insured_text !== undefined && { shipping_insured_text: shipping_insured_text || null }),
      ...(order_bump_enabled !== undefined && { order_bump_enabled }),
      ...(order_bump_name !== undefined && { order_bump_name: order_bump_name || null }),
      ...(order_bump_description !== undefined && { order_bump_description: order_bump_description || null }),
      ...(order_bump_price_usd !== undefined && { order_bump_price_usd }),
      ...(order_bump_compare_at_price_usd !== undefined && { order_bump_compare_at_price_usd }),
      ...(order_bump_image_url !== undefined && { order_bump_image_url: order_bump_image_url || null }),
    });
    if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
