import { NextRequest, NextResponse } from "next/server";
import { syncEbayProducts, isEbayConfigured, hasEbayUserToken, isEbayOAuthReady } from "@/lib/ebay";
import { createServerAdminClient } from "@/lib/supabase/server-admin";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const SYNC_SECRET = process.env.EBAY_SYNC_SECRET || ADMIN_PASSWORD;

function isAuthorized(request: NextRequest) {
  const token =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    request.cookies.get("admin_token")?.value ||
    "";
  const secret = SYNC_SECRET || ADMIN_PASSWORD;
  return !!secret && token === secret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const configured = isEbayConfigured();
  const oauthReady = isEbayOAuthReady();
  const hasUserToken = await hasEbayUserToken();
  const env = (process.env.EBAY_ENVIRONMENT || "production").toLowerCase();
  const readyToSync = configured && oauthReady && hasUserToken;
  let message = "Add EBAY_CLIENT_ID, EBAY_CLIENT_SECRET and EBAY_REDIRECT_URI in Vercel.";
  if (configured && oauthReady && hasUserToken) message = "eBay connected. Ready to sync.";
  else if (configured && oauthReady && !hasUserToken) message = "Connect your eBay account to sync inventory.";
  else if (configured && !oauthReady) message = "Add EBAY_REDIRECT_URI in Vercel (e.g. https://yourdomain.com/api/ebay-oauth/callback).";
  return NextResponse.json({
    ok: true,
    configured,
    oauthReady,
    hasUserToken,
    readyToSync,
    environment: env,
    message,
  });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rollback = request.nextUrl.searchParams.get("rollback") === "1";
  if (rollback) {
    const supabase = createServerAdminClient();
    if (!supabase) return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 500 });
    const { data, error } = await supabase.from("products").delete().eq("source", "ebay").select("id");
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    const count = Array.isArray(data) ? data.length : 0;
    return NextResponse.json({ ok: true, rollback: true, deleted: count });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  // eslint-disable-next-line no-console
  console.log("[sync-ebay] start", { dryRun });

  const result = await syncEbayProducts({ dryRun });
  if (result.errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error("[sync-ebay] completed with errors", result.errors);
    return NextResponse.json({ ok: false, ...result }, { status: 500 });
  }

  // eslint-disable-next-line no-console
  console.log("[sync-ebay] done", result);
  return NextResponse.json({ ok: true, ...result });
}

