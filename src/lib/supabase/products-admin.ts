/**
 * Escritas em products usando Service Role (ignora RLS).
 * Usar apenas em rotas de API já protegidas por auth do admin.
 */
import { createServerAdminClient } from "./server-admin";
import type { Product } from "@/data/products";

export async function insertProductAdmin(product: Omit<Product, "id">): Promise<{ id: string } | { error: string }> {
  const supabase = createServerAdminClient();
  if (!supabase) return { error: "SUPABASE_SERVICE_ROLE_KEY not set" };
  try {
    const images = product.images ?? (product.image ? [product.image] : []);
    const { data, error } = await supabase
      .from("products")
      .insert({
        name: product.name,
        description: product.description,
        category: product.category,
        price_usd: product.priceUsd,
        stock_quantity: product.stockQuantity ?? 0,
        free_shipping: product.freeShipping === true,
        images,
        variations: product.variations ?? [],
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    return { id: String(data.id) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to insert" };
  }
}

export async function updateProductAdmin(id: string, product: Partial<Omit<Product, "id">>): Promise<{ error?: string }> {
  const supabase = createServerAdminClient();
  if (!supabase) return { error: "SUPABASE_SERVICE_ROLE_KEY not set" };
  try {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (product.name != null) payload.name = product.name;
    if (product.description != null) payload.description = product.description;
    if (product.category != null) payload.category = product.category;
    if (product.priceUsd != null) payload.price_usd = product.priceUsd;
    if (product.stockQuantity != null) payload.stock_quantity = product.stockQuantity;
    if (product.freeShipping != null) payload.free_shipping = product.freeShipping;
    if (product.images != null && product.images.length > 0) payload.images = product.images;
    else if (product.image != null && product.image.trim() !== "") payload.images = [product.image.trim()];
    if (product.variations != null) payload.variations = product.variations;
    const { error } = await supabase.from("products").update(payload).eq("id", id);
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update" };
  }
}

export async function deleteProductAdmin(id: string): Promise<{ error?: string }> {
  const supabase = createServerAdminClient();
  if (!supabase) return { error: "SUPABASE_SERVICE_ROLE_KEY not set" };
  try {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete" };
  }
}
