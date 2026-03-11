import { NextRequest, NextResponse } from "next/server";
import { syncMockEbayProducts } from "@/lib/ebay";

const SYNC_SECRET = process.env.EBAY_SYNC_SECRET || process.env.ADMIN_PASSWORD || "";

function isAuthorized(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  return SYNC_SECRET ? token === SYNC_SECRET : false;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  // eslint-disable-next-line no-console
  console.log("[sync-ebay] start", { dryRun });

  const result = await syncMockEbayProducts({ dryRun });
  if (result.errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error("[sync-ebay] completed with errors", result.errors);
    return NextResponse.json({ ok: false, ...result }, { status: 500 });
  }

  // eslint-disable-next-line no-console
  console.log("[sync-ebay] done", result);
  return NextResponse.json({ ok: true, ...result });
}

