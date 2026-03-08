import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Ipaper123!";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (token === ADMIN_PASSWORD) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
