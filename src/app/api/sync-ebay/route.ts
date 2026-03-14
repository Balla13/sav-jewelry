import { NextRequest, NextResponse } from "next/server";
import { syncEbayProducts, isEbayConfigured } from "@/lib/ebay";

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
  const env = (process.env.EBAY_ENVIRONMENT || "production").toLowerCase();
  return NextResponse.json({
    ok: true,
    configured,
    environment: env,
    message: configured ? "eBay connected. Ready to sync." : "Add EBAY_CLIENT_ID and EBAY_CLIENT_SECRET in Vercel.",
  });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

