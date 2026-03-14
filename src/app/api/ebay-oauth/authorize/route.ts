import { NextRequest, NextResponse } from "next/server";
import { buildEbayAuthorizationUrl } from "@/lib/ebay";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

function isAuthorized(request: NextRequest) {
  const token =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    request.cookies.get("admin_token")?.value ||
    "";
  return !!ADMIN_PASSWORD && token === ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  const state = request.nextUrl.searchParams.get("state") || "admin-ebay-sync";
  const url = buildEbayAuthorizationUrl(state);
  return NextResponse.redirect(url);
}
