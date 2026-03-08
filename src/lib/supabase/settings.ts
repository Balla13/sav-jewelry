import { createClient } from "./client";

export type Settings = {
  instagram_url: string | null;
  facebook_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  shipping_fee_usd: number;
  /** Domestic (US) flat fee when free shipping not met. */
  international_shipping_usd: number;
  site_logo_url: string | null;
  site_icon_url: string | null;
  home_hero_banner_desktop_url: string | null;
  home_hero_banner_mobile_url: string | null;
  meta_pixel_id: string | null;
  /** Etiqueta editável ex: "Peça única". Vazio = não exibe. */
  unique_piece_label: string | null;
  /** Ex: "Envio com seguro incluído". Vazio = não exibe. */
  shipping_insured_text: string | null;
  order_bump_enabled: boolean;
  order_bump_name: string | null;
  order_bump_description: string | null;
  order_bump_price_usd: number | null;
  order_bump_compare_at_price_usd: number | null;
  order_bump_image_url: string | null;
};

export async function getSettings(): Promise<Settings> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("settings")
      .select(
        "instagram_url, facebook_url, contact_email, contact_phone, shipping_fee_usd, international_shipping_usd, site_logo_url, site_icon_url, home_hero_banner_desktop_url, home_hero_banner_mobile_url, meta_pixel_id, unique_piece_label, shipping_insured_text, order_bump_enabled, order_bump_name, order_bump_description, order_bump_price_usd, order_bump_compare_at_price_usd, order_bump_image_url"
      )
      .eq("id", 1)
      .single();
    if (error || !data) {
      return {
        instagram_url: null,
        facebook_url: null,
        contact_email: null,
        contact_phone: null,
        shipping_fee_usd: 5,
        international_shipping_usd: 35,
        site_logo_url: null,
        site_icon_url: null,
        home_hero_banner_desktop_url: null,
        home_hero_banner_mobile_url: null,
        meta_pixel_id: null,
        unique_piece_label: null,
        shipping_insured_text: null,
        order_bump_enabled: true,
        order_bump_name: null,
        order_bump_description: null,
        order_bump_price_usd: null,
        order_bump_compare_at_price_usd: null,
        order_bump_image_url: null,
      };
    }
    const fee = data.shipping_fee_usd != null ? Number(data.shipping_fee_usd) : 5;
    const intlFee = data.international_shipping_usd != null ? Number(data.international_shipping_usd) : 35;
    return {
      instagram_url: data.instagram_url ?? null,
      facebook_url: data.facebook_url ?? null,
      contact_email: data.contact_email ?? null,
      contact_phone: data.contact_phone ?? null,
      shipping_fee_usd: Number.isFinite(fee) && fee >= 0 ? fee : 5,
      international_shipping_usd: Number.isFinite(intlFee) && intlFee >= 0 ? intlFee : 35,
      site_logo_url: data.site_logo_url ?? null,
      site_icon_url: data.site_icon_url ?? null,
      home_hero_banner_desktop_url: data.home_hero_banner_desktop_url ?? null,
      home_hero_banner_mobile_url: data.home_hero_banner_mobile_url ?? null,
      meta_pixel_id: data.meta_pixel_id ?? null,
      unique_piece_label: data.unique_piece_label ?? null,
      shipping_insured_text: data.shipping_insured_text ?? null,
      order_bump_enabled: data.order_bump_enabled ?? true,
      order_bump_name: data.order_bump_name ?? null,
      order_bump_description: data.order_bump_description ?? null,
      order_bump_price_usd:
        data.order_bump_price_usd != null && !Number.isNaN(Number(data.order_bump_price_usd))
          ? Number(data.order_bump_price_usd)
          : null,
      order_bump_compare_at_price_usd:
        data.order_bump_compare_at_price_usd != null &&
        !Number.isNaN(Number(data.order_bump_compare_at_price_usd))
          ? Number(data.order_bump_compare_at_price_usd)
          : null,
      order_bump_image_url: data.order_bump_image_url ?? null,
    };
  } catch {
    return {
      instagram_url: null,
      facebook_url: null,
      contact_email: null,
      contact_phone: null,
      shipping_fee_usd: 5,
      international_shipping_usd: 35,
      site_logo_url: null,
      site_icon_url: null,
      home_hero_banner_desktop_url: null,
      home_hero_banner_mobile_url: null,
      meta_pixel_id: null,
      unique_piece_label: null,
      shipping_insured_text: null,
      order_bump_enabled: true,
      order_bump_name: null,
      order_bump_description: null,
      order_bump_price_usd: null,
      order_bump_compare_at_price_usd: null,
      order_bump_image_url: null,
    };
  }
}

export async function updateSettings(updates: Partial<Settings>): Promise<{ error?: string }> {
  try {
    const supabase = createClient();
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.instagram_url !== undefined) payload.instagram_url = updates.instagram_url || null;
    if (updates.facebook_url !== undefined) payload.facebook_url = updates.facebook_url || null;
    if (updates.contact_email !== undefined) payload.contact_email = updates.contact_email || null;
    if (updates.contact_phone !== undefined) payload.contact_phone = updates.contact_phone || null;
    if (updates.shipping_fee_usd !== undefined) {
      const v = Number(updates.shipping_fee_usd);
      payload.shipping_fee_usd = Number.isFinite(v) && v >= 0 ? v : 5;
    }
    if (updates.international_shipping_usd !== undefined) {
      const v = Number(updates.international_shipping_usd);
      payload.international_shipping_usd = Number.isFinite(v) && v >= 0 ? v : 35;
    }
    if (updates.site_logo_url !== undefined) payload.site_logo_url = updates.site_logo_url || null;
    if (updates.site_icon_url !== undefined) payload.site_icon_url = updates.site_icon_url || null;
    if (updates.home_hero_banner_desktop_url !== undefined) payload.home_hero_banner_desktop_url = updates.home_hero_banner_desktop_url || null;
    if (updates.home_hero_banner_mobile_url !== undefined) payload.home_hero_banner_mobile_url = updates.home_hero_banner_mobile_url || null;
    if (updates.meta_pixel_id !== undefined) payload.meta_pixel_id = updates.meta_pixel_id || null;
    if (updates.unique_piece_label !== undefined) payload.unique_piece_label = updates.unique_piece_label || null;
    if (updates.shipping_insured_text !== undefined) payload.shipping_insured_text = updates.shipping_insured_text || null;
    if (updates.order_bump_enabled !== undefined) payload.order_bump_enabled = !!updates.order_bump_enabled;
    if (updates.order_bump_name !== undefined) payload.order_bump_name = updates.order_bump_name || null;
    if (updates.order_bump_description !== undefined) payload.order_bump_description = updates.order_bump_description || null;
    if (updates.order_bump_price_usd !== undefined) {
      const v = Number(updates.order_bump_price_usd);
      payload.order_bump_price_usd = Number.isFinite(v) && v >= 0 ? v : null;
    }
    if (updates.order_bump_compare_at_price_usd !== undefined) {
      const v = Number(updates.order_bump_compare_at_price_usd);
      payload.order_bump_compare_at_price_usd = Number.isFinite(v) && v >= 0 ? v : null;
    }
    if (updates.order_bump_image_url !== undefined) payload.order_bump_image_url = updates.order_bump_image_url || null;
    const { error } = await supabase.from("settings").update(payload).eq("id", 1);
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update settings" };
  }
}
