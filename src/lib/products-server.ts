import type { Product } from "@/data/products";
import { products as staticProducts } from "@/data/products";
import {
  getProductsFromSupabase,
  getProductByIdFromSupabase,
} from "@/lib/supabase/products";

export async function getProductsFromFile(): Promise<Product[]> {
  try {
    const fromDb = await getProductsFromSupabase();
    const fromDbIds = new Set(fromDb.map((p) => p.id));
    const extra = staticProducts.filter((p) => !fromDbIds.has(p.id));
    return fromDb.length > 0 ? [...fromDb, ...extra] : [...staticProducts];
  } catch {
    return [...staticProducts];
  }
}

export async function getProductByIdFromFile(id: string): Promise<Product | undefined> {
  try {
    const fromDb = await getProductByIdFromSupabase(id);
    if (fromDb) return fromDb;
  } catch {
    // fallback
  }
  return staticProducts.find((p) => p.id === id);
}
