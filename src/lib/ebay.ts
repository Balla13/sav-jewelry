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

function getEbayBaseUrl(): string {
  const env = (process.env.EBAY_ENVIRONMENT || "production").toLowerCase();
  return env === "sandbox" ? "https://api.sandbox.ebay.com" : "https://api.ebay.com";
}

const SELL_INVENTORY_SCOPE = "https://api.ebay.com/oauth/api_scope/sell.inventory";

export function isEbayConfigured(): boolean {
  return !!(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET);
}

export function isEbayOAuthReady(): boolean {
  return !!(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET && process.env.EBAY_REDIRECT_URI);
}

async function getRefreshTokenFromDb(): Promise<string | null> {
  const supabase = createServerAdminClient();
  if (!supabase) return null;
  const { data } = await supabase.from("ebay_tokens").select("refresh_token").eq("id", "default").maybeSingle();
  return data?.refresh_token ?? null;
}

export async function hasEbayUserToken(): Promise<boolean> {
  const token = await getRefreshTokenFromDb();
  return !!token;
}

export async function saveRefreshTokenToDb(refreshToken: string): Promise<void> {
  const supabase = createServerAdminClient();
  if (!supabase) throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
  const { error } = await supabase
    .from("ebay_tokens")
    .upsert({ id: "default", refresh_token: refreshToken, updated_at: new Date().toISOString() }, { onConflict: "id" });
  if (error) throw new Error(`Failed to save eBay token: ${error.message}`);
}

function getAuthBaseUrl(): string {
  const env = (process.env.EBAY_ENVIRONMENT || "production").toLowerCase();
  return env === "sandbox" ? "https://auth.sandbox.ebay.com" : "https://auth.ebay.com";
}

export function buildEbayAuthorizationUrl(state: string): string {
  const clientId = (process.env.EBAY_CLIENT_ID || "").trim();
  const redirectUri = (process.env.EBAY_REDIRECT_URI || "").trim();
  if (!clientId || !redirectUri) throw new Error("Missing EBAY_CLIENT_ID or EBAY_REDIRECT_URI");
  const authUrl = getAuthBaseUrl();
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SELL_INVENTORY_SCOPE,
    state,
    prompt: "login",
  });
  return `${authUrl}/oauth2/authorize?${params.toString()}`;
}

export async function exchangeEbayCodeForTokens(code: string): Promise<{ access_token: string; refresh_token: string }> {
  const clientId = (process.env.EBAY_CLIENT_ID || "").trim();
  const clientSecret = (process.env.EBAY_CLIENT_SECRET || "").trim();
  const redirectUri = (process.env.EBAY_REDIRECT_URI || "").trim();
  if (!clientId || !clientSecret || !redirectUri) throw new Error("Missing EBAY_CLIENT_ID, EBAY_CLIENT_SECRET or EBAY_REDIRECT_URI");

  const baseUrl = getEbayBaseUrl();
  const basic = Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: decodeURIComponent(code),
    redirect_uri: redirectUri,
  }).toString();

  const res = await fetch(`${baseUrl}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !json.access_token || !json.refresh_token) {
    const errMsg = [json.error, json.error_description].filter(Boolean).join(" — ") || `HTTP ${res.status}`;
    throw new Error(`eBay OAuth exchange failed: ${errMsg}`);
  }
  return { access_token: json.access_token, refresh_token: json.refresh_token };
}

let cachedToken: { accessToken: string; expiresAtMs: number } | null = null;

async function getEbayAccessToken(): Promise<string> {
  const clientId = (process.env.EBAY_CLIENT_ID || "").trim();
  const clientSecret = (process.env.EBAY_CLIENT_SECRET || "").trim();
  if (!clientId || !clientSecret) throw new Error("Missing EBAY_CLIENT_ID or EBAY_CLIENT_SECRET");

  if (cachedToken && Date.now() < cachedToken.expiresAtMs - 30_000) {
    return cachedToken.accessToken;
  }

  const refreshToken = await getRefreshTokenFromDb();
  if (!refreshToken) {
    throw new Error("eBay not connected. Please connect your eBay account first (eBay Sync → Connect eBay).");
  }

  const baseUrl = getEbayBaseUrl();
  const basic = Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  }).toString();

  // eslint-disable-next-line no-console
  console.log("[ebay] refreshing User token", { environment: process.env.EBAY_ENVIRONMENT || "production" });

  const res = await fetch(`${baseUrl}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !json.access_token) {
    const errMsg = [json.error, json.error_description].filter(Boolean).join(" — ") || `HTTP ${res.status}`;
    // eslint-disable-next-line no-console
    console.error("[ebay] OAuth refresh failed", { status: res.status, error: json.error, error_description: json.error_description });
    throw new Error(`eBay OAuth failed: ${errMsg}. Try disconnecting and reconnecting your eBay account.`);
  }

  if (json.refresh_token) {
    await saveRefreshTokenToDb(json.refresh_token);
  }

  const expiresIn = Number(json.expires_in || 0);
  cachedToken = {
    accessToken: json.access_token,
    expiresAtMs: Date.now() + Math.max(60, expiresIn) * 1000,
  };
  return json.access_token;
}

type EbayInventoryItem = {
  sku: string;
  product?: {
    title?: string;
    description?: string;
    imageUrls?: string[];
  };
  availability?: {
    shipToLocationAvailability?: {
      quantity?: number;
    };
  };
};

async function ebayRequest<T>(path: string): Promise<T> {
  const token = await getEbayAccessToken();
  const baseUrl = getEbayBaseUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
  });

  const text = await res.text();
  const json = (text ? JSON.parse(text) : {}) as T & { errors?: { message?: string }[] };

  if (!res.ok) {
    const msg =
      (json as any)?.errors?.[0]?.message ||
      (json as any)?.message ||
      `${res.status} ${res.statusText}`;
    throw new Error(`eBay API error: ${msg}`);
  }

  return json as T;
}

async function fetchOfferPriceBySku(sku: string): Promise<number | null> {
  // Best-effort: price often lives on offers, not inventory items.
  type Offer = { pricingSummary?: { price?: { value?: string | number } } };
  type OfferSearch = { offers?: Offer[] };

  try {
    const data = await ebayRequest<OfferSearch>(`/sell/inventory/v1/offer?sku=${encodeURIComponent(sku)}&limit=1`);
    const value = (data.offers?.[0] as any)?.pricingSummary?.price?.value;
    const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export async function fetchEbayProducts(): Promise<EbayProduct[]> {
  if (!isEbayConfigured()) return [];

  const products: EbayProduct[] = [];
  let offset = 0;
  const limit = 50;

  // eslint-disable-next-line no-console
  console.log("[ebay] fetching inventory items", { limit });

  while (true) {
    type InventoryList = { inventoryItems?: { sku: string }[]; total?: number };
    const list = await ebayRequest<InventoryList>(
      `/sell/inventory/v1/inventory_item?limit=${limit}&offset=${offset}`
    );
    const skus = (list.inventoryItems || []).map((i) => i.sku).filter(Boolean);
    if (skus.length === 0) break;

    // Fetch full item details per sku (keeps code simple and robust).
    for (const sku of skus) {
      const item = await ebayRequest<EbayInventoryItem>(`/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`);
      const title = item.product?.title?.trim() || sku;
      const description = item.product?.description || "";
      const images = Array.isArray(item.product?.imageUrls) ? item.product!.imageUrls!.filter(Boolean) : [];
      const quantity = Math.max(
        0,
        Math.floor(Number(item.availability?.shipToLocationAvailability?.quantity ?? 0) || 0)
      );
      const offerPrice = await fetchOfferPriceBySku(sku);

      products.push({
        title,
        description,
        images,
        sku,
        quantity,
        price: offerPrice ?? 0,
        source_id: sku,
      });
    }

    offset += skus.length;
    if (skus.length < limit) break;
    if (typeof list.total === "number" && offset >= list.total) break;
  }

  // eslint-disable-next-line no-console
  console.log("[ebay] fetched products", { count: products.length });
  return products;
}

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

export async function syncEbayProducts(params?: { dryRun?: boolean }): Promise<SyncResult> {
  const dryRun = params?.dryRun === true;
  const result: SyncResult = { inserted: 0, updated: 0, sold: 0, errors: [] };

  const supabase = createServerAdminClient();
  if (!supabase) {
    return { ...result, errors: ["SUPABASE_SERVICE_ROLE_KEY not set"] };
  }

  let products: EbayProduct[] = [];
  try {
    if (!isEbayConfigured()) {
      products = await fetchMockEbayProducts();
    } else if (!(await hasEbayUserToken())) {
      result.errors.push("eBay not connected. Connect your eBay account first (Connect eBay button).");
      return result;
    } else {
      products = await fetchEbayProducts();
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch from eBay";
    result.errors.push(msg);
    // eslint-disable-next-line no-console
    console.error("[sync-ebay] fetch failed", msg);
    return result;
  }
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
        console.log("[sync-ebay][dry-run] upsert", { source_id: payload.source_id, sku: payload.sku, qty: payload.quantity });
        continue;
      }

      const { data: existing, error: existErr } = await supabase
        .from("products")
        .select("id")
        .eq("source", "ebay")
        .eq("source_id", payload.source_id)
        .maybeSingle();
      if (existErr) {
        result.errors.push(`Lookup failed sku=${p.sku}: ${existErr.message}`);
        continue;
      }

      // Upsert by (source, source_id)
      const { data, error } = await supabase
        .from("products")
        .upsert(payload, { onConflict: "source,source_id" })
        .select("id, quantity, stock_quantity, status")
        .single();

      if (error) {
        result.errors.push(`Upsert failed sku=${p.sku}: ${error.message}`);
        continue;
      }

      const wasInsert = !existing?.id;
      const qty = Number((data as any)?.quantity ?? (data as any)?.stock_quantity ?? payload.quantity) || 0;
      const isSold = qty === 0;

      if (wasInsert) {
        result.inserted += 1;
        // eslint-disable-next-line no-console
        console.log("[sync-ebay] inserted", { sku: p.sku, id: (data as any)?.id, qty });
      } else if (isSold) {
        result.sold += 1;
        // eslint-disable-next-line no-console
        console.log("[sync-ebay] marked sold", { sku: p.sku, id: (data as any)?.id });
      } else {
        result.updated += 1;
        // eslint-disable-next-line no-console
        console.log("[sync-ebay] updated", { sku: p.sku, id: (data as any)?.id, qty });
      }
    } catch (e) {
      result.errors.push(e instanceof Error ? e.message : "Unknown sync error");
    }
  }

  return result;
}

// Backwards compatibility (older imports)
export async function syncMockEbayProducts(params?: { dryRun?: boolean }): Promise<SyncResult> {
  return syncEbayProducts(params);
}

