import { createServerAdminClient } from "@/lib/supabase/server-admin";

export type EbayProduct = {
  title: string;
  price: number;
  quantity: number;
  sku: string;
  images: string[];
  source_id?: string;
  description?: string;
};

export type SyncResult = {
  inserted: number;
  updated: number;
  sold: number;
  errors: string[];
};

export async function fetchMockEbayProducts(): Promise<EbayProduct[]> {
  return [
    {
      title: "Ruby Gemstone 14ct",
      price: 150,
      quantity: 1,
      sku: "ruby-14ct",
      images: ["https://example.com/image.jpg"],
      source_id: "mock-ruby-14ct",
      description: "Mock product for local sync testing.",
    },
  ];
}

function toDbProduct(p: EbayProduct) {
  const qty = Number.isFinite(p.quantity) ? Math.max(0, Math.floor(p.quantity)) : 0;
  const price = Number.isFinite(p.price) ? Math.max(0, Number(p.price)) : 0;
  const sourceId = (p.source_id || p.sku || "").trim();
  const sku = (p.sku || "").trim() || null;
  const images = Array.isArray(p.images) ? p.images.filter(Boolean) : [];

  return {
    // Existing site fields
    name: p.title,
    description: p.description || "",
    // keep existing schema compatible: category must be valid; we set a safe default
    category: "Rare Finds",
    price_usd: price,
    stock_quantity: qty,
    images,

    // New sync-friendly fields
    title: p.title,
    price,
    quantity: qty,
    sku,
    status: qty === 0 ? "sold" : "active",
    source: "ebay",
    source_id: sourceId || null,
    updated_at: new Date().toISOString(),
  };
}

export async function syncMockEbayProducts(params?: { dryRun?: boolean }): Promise<SyncResult> {
  const dryRun = params?.dryRun === true;
  const result: SyncResult = { inserted: 0, updated: 0, sold: 0, errors: [] };

  const supabase = createServerAdminClient();
  if (!supabase) {
    return { ...result, errors: ["SUPABASE_SERVICE_ROLE_KEY not set"] };
  }

  const products = await fetchMockEbayProducts();
  if (!products.length) return result;

  for (const p of products) {
    try {
      const payload = toDbProduct(p);
      if (!payload.source_id) {
        result.errors.push(`Missing source_id for sku=${p.sku}`);
        continue;
      }

      if (dryRun) {
        // eslint-disable-next-line no-console
        console.log("[sync-ebay][dry-run] upsert", payload.source_id, payload.sku);
        continue;
      }

      // Upsert by (source, source_id)
      const { data, error } = await supabase
        .from("products")
        .upsert(payload, { onConflict: "source,source_id" })
        .select("id, quantity, stock_quantity")
        .single();

      if (error) {
        result.errors.push(`Upsert failed sku=${p.sku}: ${error.message}`);
        continue;
      }

      // Best-effort counts: if quantity=0, treat as sold, else treat as updated.
      const qty = Number((data as any)?.quantity ?? (data as any)?.stock_quantity ?? payload.quantity) || 0;
      if (qty === 0) result.sold += 1;
      else result.updated += 1;
    } catch (e) {
      result.errors.push(e instanceof Error ? e.message : "Unknown sync error");
    }
  }

  return result;
}

