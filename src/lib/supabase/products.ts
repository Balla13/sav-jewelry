import { createClient } from "./client";
import type { Product } from "@/data/products";
import type { ProductCategory } from "@/data/products";

export type ProductRow = {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  price_usd: number;
  compare_at_price: number | null;
  stock_quantity: number | null;
  free_shipping: boolean | null;
  images: string[] | null;
  variations: string[] | null;
  created_at?: string;
  updated_at?: string;
};

function rowToProduct(row: ProductRow): Product {
  const images = Array.isArray(row.images) && row.images.length > 0 ? row.images : [];
  const compareAt = row.compare_at_price != null ? Number(row.compare_at_price) : undefined;
  return {
    id: String(row.id),
    name: row.name,
    description: row.description,
    category: row.category,
    image: images[0] || "",
    images: images.length > 0 ? images : undefined,
    variations: Array.isArray(row.variations) && row.variations.length > 0 ? row.variations : undefined,
    priceUsd: Number(row.price_usd) || 0,
    compareAtPriceUsd: compareAt != null && Number.isFinite(compareAt) ? compareAt : undefined,
    stockQuantity: row.stock_quantity != null ? Number(row.stock_quantity) : 0,
    freeShipping: row.free_shipping === true,
  };
}

export async function getProductsFromSupabase(): Promise<Product[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, name, description, category, price_usd, compare_at_price, stock_quantity, free_shipping, images, variations")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    if (!data || data.length === 0) return [];
    return data.map((row) => rowToProduct(row as ProductRow));
  } catch {
    return [];
  }
}

export async function getProductByIdFromSupabase(id: string): Promise<Product | undefined> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, name, description, category, price_usd, compare_at_price, stock_quantity, free_shipping, images, variations")
      .eq("id", id)
      .single();
    if (error || !data) return undefined;
    return rowToProduct(data as ProductRow);
  } catch {
    return undefined;
  }
}

export async function insertProductSupabase(product: Omit<Product, "id">): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = createClient();
    const images = product.images ?? (product.image ? [product.image] : []);
    const { data, error } = await supabase
      .from("products")
      .insert({
        name: product.name,
        description: product.description,
        category: product.category,
        price_usd: product.priceUsd,
        compare_at_price: product.compareAtPriceUsd != null ? product.compareAtPriceUsd : null,
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

export async function updateProductSupabase(id: string, product: Partial<Omit<Product, "id">>): Promise<{ error?: string }> {
  try {
    const supabase = createClient();
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (product.name != null) payload.name = product.name;
    if (product.description != null) payload.description = product.description;
    if (product.category != null) payload.category = product.category;
    if (product.priceUsd != null) payload.price_usd = product.priceUsd;
    if (product.compareAtPriceUsd !== undefined) payload.compare_at_price = product.compareAtPriceUsd != null ? product.compareAtPriceUsd : null;
    if (product.stockQuantity != null) payload.stock_quantity = product.stockQuantity;
    if (product.freeShipping != null) payload.free_shipping = product.freeShipping;
    if (product.images != null) payload.images = product.images;
    if (product.variations != null) payload.variations = product.variations;
    const { error } = await supabase.from("products").update(payload).eq("id", id);
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update" };
  }
}

export async function deleteProductSupabase(id: string): Promise<{ error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete" };
  }
}
