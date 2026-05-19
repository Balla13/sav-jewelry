import { createServerAdminClient } from "@/lib/supabase/server-admin";
import { XMLParser } from "fast-xml-parser";

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
  /** Mensagem quando não há erros mas o resultado precisa de explicação (ex.: 0 itens) */
  message?: string;
};

function getEbayBaseUrl(): string {
  const env = (process.env.EBAY_ENVIRONMENT || "production").toLowerCase();
  return env === "sandbox" ? "https://api.sandbox.ebay.com" : "https://api.ebay.com";
}

const SELL_INVENTORY_SCOPE = "https://api.ebay.com/oauth/api_scope/sell.inventory";

/** Desconto da loja em relação ao preço do eBay (espelho com 5% off por padrão). */
function getEbayMirrorDiscountRate(): number {
  const pct = Number(process.env.EBAY_MIRROR_DISCOUNT_PERCENT ?? "5");
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) return 0.05;
  return pct / 100;
}

/** Preço na loja = eBay − desconto; compare_at = preço original do eBay. */
export function applyEbayMirrorPricing(ebayPrice: number): { storePrice: number; compareAtPrice: number | null } {
  const original = Number.isFinite(ebayPrice) ? Math.max(0, ebayPrice) : 0;
  if (original <= 0) return { storePrice: 0, compareAtPrice: null };
  const rate = getEbayMirrorDiscountRate();
  const storePrice = Math.round(original * (1 - rate) * 100) / 100;
  const compareAtPrice = Math.round(original * 100) / 100;
  return { storePrice, compareAtPrice };
}

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
      Accept: "application/json",
      "Accept-Language": "en-US",
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

/** Busca um item no eBay por ItemID (GetItem) e retorna descrição e preço. */
async function getEbayItemByItemId(itemId: string): Promise<{ description?: string; price?: number } | null> {
  const token = await getEbayAccessToken();
  const baseUrl = getEbayBaseUrl();
  const url = `${baseUrl}/ws/api.dll`;
  const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
<GetItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <ItemID>${String(itemId).replace(/[<>&"']/g, "")}</ItemID>
  <DetailLevel>ReturnAll</DetailLevel>
</GetItemRequest>`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "X-EBAY-API-IAF-TOKEN": token,
      "X-EBAY-API-CALL-NAME": "GetItem",
      "X-EBAY-API-SITEID": "0",
      "X-EBAY-API-COMPATIBILITY-LEVEL": "1311",
      "Accept-Language": "en-US",
    },
    body: xmlBody,
  });

  const text = await res.text();
  if (!res.ok) return null;

  const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });
  const parsed = parser.parse(text) as Record<string, unknown>;
  const resp = parsed.GetItemResponse ?? parsed.getItemResponse;
  if (!resp) return null;
  const item = (resp as Record<string, unknown>).Item as Record<string, unknown> | undefined;
  if (!item) return null;

  const descRaw = item.Description ?? item.description;
  let description: string | undefined;
  if (typeof descRaw === "string") description = descRaw.trim() || undefined;
  else if (descRaw && typeof (descRaw as Record<string, unknown>)["#text"] === "string")
    description = String((descRaw as Record<string, string>)["#text"]).trim() || undefined;

  const sellingStatus = item.SellingStatus as Record<string, unknown> | undefined;
  const priceVal = sellingStatus?.CurrentPrice ?? item.BuyItNowPrice ?? item.StartPrice ?? item.CurrentPrice;
  const price = parsePrice(priceVal);

  return { description, price: price > 0 ? price : undefined };
}

/** Converte URL de imagem eBay para versão alta res (até 1600px). */
function ebayImageToHighRes(url: string): string {
  if (!url || typeof url !== "string") return url;
  return url.replace(/\bs-l\d+\b/, "s-l1600");
}

/** Extrai valor numérico de preço vindo do XML (pode ser string, number ou { "#text": "29.99" }). */
function parsePrice(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === "number" && Number.isFinite(val)) return Math.max(0, val);
  if (typeof val === "string") return Math.max(0, parseFloat(val) || 0);
  const obj = val as Record<string, unknown>;
  const text = obj["#text"] ?? obj.__value ?? obj.value;
  return parsePrice(text);
}

async function ebayTradingPost(callName: string, xmlBody: string): Promise<string> {
  const token = await getEbayAccessToken();
  const baseUrl = getEbayBaseUrl();
  const res = await fetch(`${baseUrl}/ws/api.dll`, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "X-EBAY-API-IAF-TOKEN": token,
      "X-EBAY-API-CALL-NAME": callName,
      "X-EBAY-API-SITEID": "0",
      "X-EBAY-API-COMPATIBILITY-LEVEL": "1311",
      "Accept-Language": "en-US",
    },
    body: xmlBody,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`eBay Trading API error: ${res.status} ${text.slice(0, 200)}`);
  return text;
}

/** Lista todos os anúncios ativos (GetMyeBaySelling), com paginação — espelho completo, sem filtro de data. */
async function fetchAllActiveTradingItems(): Promise<Record<string, unknown>[]> {
  const entriesPerPage = 200;
  const allItems: Record<string, unknown>[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
<GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <ActiveList><Include>true</Include><Pagination><EntriesPerPage>${entriesPerPage}</EntriesPerPage><PageNumber>${page}</PageNumber></Pagination></ActiveList>
  <DetailLevel>ReturnAll</DetailLevel>
</GetMyeBaySellingRequest>`;

    const text = await ebayTradingPost("GetMyeBaySelling", xmlBody);
    const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });
    const parsed = parser.parse(text) as Record<string, unknown>;
    const resp = (parsed.GetMyeBaySellingResponse ?? parsed.getMyeBaySellingResponse) as {
      ActiveList?: {
        ItemArray?: { Item?: Record<string, unknown> | Record<string, unknown>[] };
        PaginationResult?: { TotalNumberOfPages?: number | string; TotalNumberOfEntries?: number | string };
      };
      Errors?: { ShortMessage?: string } | { ShortMessage?: string }[];
    } | undefined;

    const activeList = resp?.ActiveList;
    const itemArray = activeList?.ItemArray?.Item;
    if (!itemArray && page === 1) {
      const errRaw = resp?.Errors;
      const errMsg = Array.isArray(errRaw)
        ? errRaw[0]?.ShortMessage
        : errRaw?.ShortMessage;
      if (errMsg) throw new Error(`eBay Trading API: ${errMsg}`);
      return [];
    }

    if (itemArray) {
      const chunk = Array.isArray(itemArray) ? itemArray : [itemArray];
      allItems.push(...chunk);
    }

    const pag = activeList?.PaginationResult;
    const pages = Number(pag?.TotalNumberOfPages ?? 1);
    totalPages = Number.isFinite(pages) && pages > 0 ? pages : 1;
    page += 1;
  }

  return allItems;
}

function tradingItemToEbayProduct(it: Record<string, unknown>, index: number): EbayProduct | null {
  const listingType = String(it.ListingType ?? it.listingType ?? "").trim();
  if (listingType === "Chinese" || listingType === "Auction") return null;

  const itemId = String(it.ItemID ?? it.itemID ?? "").trim() || `ebay-trading-${index}`;
  const skuField = String(it.SKU ?? it.sku ?? "").trim();
  const title = String(it.Title ?? "").trim() || itemId || "eBay item";
  const descRaw = it.Description ?? it.description;
  const desc =
    typeof descRaw === "string"
      ? descRaw.trim()
      : descRaw && typeof (descRaw as Record<string, unknown>)["#text"] === "string"
        ? String((descRaw as Record<string, string>)["#text"]).trim()
        : "";
  const qty = Math.max(0, Math.floor(Number(it.QuantityAvailable ?? it.Quantity ?? 0) || 0));
  const priceVal = it.BuyItNowPrice ?? it.StartPrice ?? it.CurrentPrice ?? 0;
  const price = parsePrice(priceVal);
  const pic = it.PictureDetails as Record<string, unknown> | undefined;
  let imgUrl = String(pic?.GalleryURL ?? "").trim();
  if (!imgUrl && Array.isArray(pic?.PictureURL)) imgUrl = String((pic.PictureURL as string[])[0] ?? "").trim();
  else if (!imgUrl && typeof pic?.PictureURL === "string") imgUrl = pic.PictureURL.trim();
  imgUrl = ebayImageToHighRes(imgUrl);
  const images = imgUrl ? [imgUrl] : [];

  return {
    title,
    description: desc,
    images,
    sku: skuField || itemId,
    quantity: qty,
    price,
    source_id: itemId,
  };
}

/** Anúncios ativos via Trading API (fluxo clássico) — todos os itens ativos, paginados. */
async function fetchEbayProductsFromTradingApi(): Promise<EbayProduct[]> {
  const items = await fetchAllActiveTradingItems();
  const products: EbayProduct[] = [];

  for (let i = 0; i < items.length; i++) {
    const product = tradingItemToEbayProduct(items[i], i);
    if (product) products.push(product);
  }

  // eslint-disable-next-line no-console
  console.log("[ebay] Trading API active listings", { raw: items.length, mapped: products.length });
  return products;
}

function mergeEbayProductLists(primary: EbayProduct[], secondary: EbayProduct[]): EbayProduct[] {
  const bySourceId = new Map<string, EbayProduct>();
  const skuKeys = new Set<string>();

  for (const p of primary) {
    const sid = (p.source_id || p.sku || "").trim();
    if (!sid) continue;
    bySourceId.set(sid, p);
    const sku = (p.sku || "").trim().toLowerCase();
    if (sku) skuKeys.add(sku);
  }

  for (const p of secondary) {
    const sid = (p.source_id || p.sku || "").trim();
    if (!sid || bySourceId.has(sid)) continue;
    const sku = (p.sku || "").trim().toLowerCase();
    if (sku && skuKeys.has(sku)) continue;
    bySourceId.set(sid, p);
    if (sku) skuKeys.add(sku);
  }

  return Array.from(bySourceId.values());
}

/** Retorna todos os ItemIDs atualmente ativos na conta (Trading API ActiveList, paginado). */
export async function getActiveEbayItemIds(): Promise<string[]> {
  if (!isEbayConfigured()) return [];
  try {
    const items = await fetchAllActiveTradingItems();
    const ids: string[] = [];
    for (const it of items) {
      const itemId = String(it.ItemID ?? it.itemID ?? "").trim();
      if (itemId) ids.push(itemId);
    }
    return ids;
  } catch {
    return [];
  }
}

/** Retorna todos os SKUs do inventário eBay (Inventory API). */
export async function getActiveEbaySkus(): Promise<string[]> {
  if (!isEbayConfigured()) return [];
  const skus: string[] = [];
  let offset = 0;
  const limit = 50;
  try {
    while (true) {
      type InventoryList = { inventoryItems?: { sku: string }[]; total?: number };
      const list = await ebayRequest<InventoryList>(
        `/sell/inventory/v1/inventory_item?limit=${limit}&offset=${offset}`
      );
      const chunk = (list.inventoryItems || []).map((i) => i.sku).filter(Boolean);
      skus.push(...chunk);
      if (chunk.length === 0 || chunk.length < limit) break;
      offset += chunk.length;
      if (typeof list.total === "number" && offset >= list.total) break;
    }
  } catch {
    // ignore
  }
  return skus;
}

export type RemoveUnavailableReport = {
  removed: number;
  errors: string[];
};

/** Remove da loja os produtos eBay cujo source_id não está mais ativo (vendidos/encerrados). */
export async function removeUnavailableEbayProducts(): Promise<RemoveUnavailableReport> {
  const report: RemoveUnavailableReport = { removed: 0, errors: [] };
  const supabase = createServerAdminClient();
  if (!supabase) {
    report.errors.push("SUPABASE_SERVICE_ROLE_KEY not set");
    return report;
  }
  if (!(await hasEbayUserToken())) {
    report.errors.push("eBay not connected.");
    return report;
  }

  let activeSet: Set<string>;
  try {
    const [itemIds, skus] = await Promise.all([getActiveEbayItemIds(), getActiveEbaySkus()]);
    activeSet = new Set([...itemIds, ...skus]);
  } catch (e) {
    report.errors.push(e instanceof Error ? e.message : "Failed to fetch active eBay list");
    return report;
  }

  const { data: rows, error: listErr } = await supabase
    .from("products")
    .select("id, source_id")
    .eq("source", "ebay")
    .not("source_id", "is", null);
  if (listErr) {
    report.errors.push(listErr.message);
    return report;
  }
  const products = (rows || []) as { id: string; source_id: string }[];
  for (const row of products) {
    const sid = row.source_id?.trim();
    if (!sid || activeSet.has(sid)) continue;
    const { error: delErr } = await supabase.from("products").delete().eq("id", row.id);
    if (delErr) report.errors.push(`${row.id}: ${delErr.message}`);
    else report.removed += 1;
  }
  return report;
}

async function fetchEbayProductsFromInventoryApi(): Promise<EbayProduct[]> {
  const products: EbayProduct[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    type InventoryList = { inventoryItems?: { sku: string }[]; total?: number };
    const list = await ebayRequest<InventoryList>(
      `/sell/inventory/v1/inventory_item?limit=${limit}&offset=${offset}`
    );
    const skus = (list.inventoryItems || []).map((i) => i.sku).filter(Boolean);
    if (skus.length === 0) break;

    for (const sku of skus) {
      const item = await ebayRequest<EbayInventoryItem>(`/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`);
      const title = item.product?.title?.trim() || sku;
      const description = item.product?.description || "";
      const rawImages = Array.isArray(item.product?.imageUrls) ? item.product!.imageUrls!.filter(Boolean) : [];
      const images = rawImages.map((u) => ebayImageToHighRes(String(u))).filter(Boolean);
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

  return products;
}

export async function fetchEbayProducts(): Promise<EbayProduct[]> {
  if (!isEbayConfigured()) return [];

  let fromTrading: EbayProduct[] = [];
  try {
    fromTrading = await fetchEbayProductsFromTradingApi();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[ebay] Trading API fetch failed", e);
  }

  let fromInventory: EbayProduct[] = [];
  try {
    // eslint-disable-next-line no-console
    console.log("[ebay] fetching inventory items");
    fromInventory = await fetchEbayProductsFromInventoryApi();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[ebay] Inventory API fetch failed", e);
  }

  const merged = mergeEbayProductLists(fromTrading, fromInventory);

  // eslint-disable-next-line no-console
  console.log("[ebay] fetched products (mirror)", {
    trading: fromTrading.length,
    inventory: fromInventory.length,
    merged: merged.length,
    discountPercent: getEbayMirrorDiscountRate() * 100,
  });
  return merged;
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
  const ebayPrice = Number.isFinite(p.price) ? Math.max(0, Number(p.price)) : 0;
  const { storePrice, compareAtPrice } = applyEbayMirrorPricing(ebayPrice);
  const sourceId = (p.source_id || p.sku || "").trim();
  const sku = (p.sku || "").trim() || null;
  const allImages = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
  const images = allImages.length > 0 ? [allImages[0]] : [];

  return {
    // Existing site fields (só primeira imagem, título e descrição)
    name: p.title,
    description: p.description || "",
    category: "Rare Finds",
    price_usd: storePrice,
    compare_at_price: compareAtPrice,
    stock_quantity: qty,
    images,

    // New sync-friendly fields
    title: p.title,
    price: storePrice,
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
  if (!products.length) {
    result.message =
      "Nenhum anúncio ativo encontrado no eBay (conta conectada). Verifique se há listagens ativas na sua conta e se a conexão OAuth está válida.";
    return result;
  }

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
        .select("id, description")
        .eq("source", "ebay")
        .eq("source_id", payload.source_id)
        .maybeSingle();
      if (existErr) {
        result.errors.push(`Lookup failed sku=${p.sku}: ${existErr.message}`);
        continue;
      }

      const existingDesc = (existing as { description?: string } | null)?.description?.trim();
      if (!payload.description?.trim() && existingDesc) {
        payload.description = existingDesc;
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

export type UpdateOnlyReport = {
  ok: boolean;
  updated: number;
  skipped: number;
  notFound: number;
  errors: string[];
};

/** Atualiza apenas as descrições dos produtos já cadastrados (source=ebay). Não cria produtos novos. */
export async function updateOnlyDescriptions(): Promise<UpdateOnlyReport> {
  const report: UpdateOnlyReport = { ok: true, updated: 0, skipped: 0, notFound: 0, errors: [] };
  const supabase = createServerAdminClient();
  if (!supabase) {
    report.ok = false;
    report.errors.push("SUPABASE_SERVICE_ROLE_KEY not set");
    return report;
  }

  const { data: products, error: listErr } = await supabase
    .from("products")
    .select("id, source_id, description")
    .eq("source", "ebay")
    .not("source_id", "is", null);
  if (listErr) {
    report.ok = false;
    report.errors.push(listErr.message);
    return report;
  }
  const rows = (products || []) as { id: string; source_id: string; description: string | null }[];
  if (rows.length === 0) return report;

  for (const row of rows) {
    const sourceId = row.source_id?.trim();
    if (!sourceId) continue;
    try {
      const item = await getEbayItemByItemId(sourceId);
      if (!item) {
        report.notFound += 1;
        continue;
      }
      if (!item.description?.trim()) {
        report.skipped += 1;
        continue;
      }
      if (row.description?.trim() === item.description.trim()) {
        report.skipped += 1;
        continue;
      }
      const { error: updErr } = await supabase.from("products").update({ description: item.description.trim() }).eq("id", row.id);
      if (updErr) report.errors.push(`${sourceId}: ${updErr.message}`);
      else report.updated += 1;
    } catch (e) {
      report.errors.push(`${sourceId}: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }
  return report;
}

/** Atualiza apenas os preços dos produtos já cadastrados (source=ebay). Não cria produtos novos. */
export async function updateOnlyPrices(): Promise<UpdateOnlyReport> {
  const report: UpdateOnlyReport = { ok: true, updated: 0, skipped: 0, notFound: 0, errors: [] };
  const supabase = createServerAdminClient();
  if (!supabase) {
    report.ok = false;
    report.errors.push("SUPABASE_SERVICE_ROLE_KEY not set");
    return report;
  }

  const { data: products, error: listErr } = await supabase
    .from("products")
    .select("id, source_id, price_usd")
    .eq("source", "ebay")
    .not("source_id", "is", null);
  if (listErr) {
    report.ok = false;
    report.errors.push(listErr.message);
    return report;
  }
  const rows = (products || []) as { id: string; source_id: string; price_usd: number | null }[];
  if (rows.length === 0) return report;

  for (const row of rows) {
    const sourceId = row.source_id?.trim();
    if (!sourceId) continue;
    try {
      const item = await getEbayItemByItemId(sourceId);
      if (!item || item.price == null || item.price <= 0) {
        report.notFound += 1;
        continue;
      }
      const { storePrice, compareAtPrice } = applyEbayMirrorPricing(item.price);
      const existingPrice = Number(row.price_usd) || 0;
      if (existingPrice === storePrice) {
        report.skipped += 1;
        continue;
      }
      const { error: updErr } = await supabase
        .from("products")
        .update({ price_usd: storePrice, compare_at_price: compareAtPrice })
        .eq("id", row.id);
      if (updErr) report.errors.push(`${sourceId}: ${updErr.message}`);
      else report.updated += 1;
    } catch (e) {
      report.errors.push(`${sourceId}: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }
  return report;
}

// Backwards compatibility (older imports)
export async function syncMockEbayProducts(params?: { dryRun?: boolean }): Promise<SyncResult> {
  return syncEbayProducts(params);
}

