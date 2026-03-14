import { NextRequest, NextResponse } from "next/server";
import { exchangeEbayCodeForTokens, saveRefreshTokenToDb, isEbayOAuthReady } from "@/lib/ebay";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

function isAuthorized(request: NextRequest) {
  const token =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    request.cookies.get("admin_token")?.value ||
    "";
  return !!ADMIN_PASSWORD && token === ADMIN_PASSWORD;
}

function getBaseUrl(request: NextRequest): string {
  const u = new URL(request.url);
  return `${u.protocol}//${u.host}`;
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  const state = request.nextUrl.searchParams.get("state") || "en";
  const redirectSuccess = `${baseUrl}/${state}/admin/ebay-sync?connected=1`;
  const redirectError = `${baseUrl}/${state}/admin/ebay-sync?error=oauth`;

  if (!isAuthorized(request)) {
    return NextResponse.redirect(redirectError);
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(redirectError);
  }

  if (!isEbayOAuthReady()) {
    return NextResponse.redirect(`${baseUrl}/${state}/admin/ebay-sync?error=config`);
  }

  try {
    const { refresh_token } = await exchangeEbayCodeForTokens(code);
    await saveRefreshTokenToDb(refresh_token);
    return NextResponse.redirect(redirectSuccess);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[ebay-oauth] callback failed", e);
    return NextResponse.redirect(redirectError);
  }
}
