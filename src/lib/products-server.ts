import type { Product } from "@/data/products";
import { products as staticProducts } from "@/data/products";
import {
  getProductsFromSupabase,
  getProductByIdFromSupabase,
} from "@/lib/supabase/products";

export async function getProductsFromFile(): Promise<Product[]> {
  try {
    const fromDb = await getProductsFromSupabase();
    if (fromDb.length > 0) return fromDb;
  } catch {
    // fallback
  }
  return [...staticProducts];
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
