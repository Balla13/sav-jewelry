import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Ipaper123!";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    if (password === ADMIN_PASSWORD) {
      const res = NextResponse.json({ success: true });
      res.cookies.set("admin_token", ADMIN_PASSWORD, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/",
      });
      return res;
    }
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
