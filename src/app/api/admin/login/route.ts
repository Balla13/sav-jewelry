import { NextRequest, NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Ipaper123!";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    if (password === ADMIN_PASSWORD) {
      const res = NextResponse.json({ success: true });
      const isSecure = process.env.VERCEL === "1" || (typeof request.nextUrl?.protocol === "string" && request.nextUrl.protocol === "https:");
      res.cookies.set("admin_token", ADMIN_PASSWORD, {
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax",
        maxAge: 60 * 10, // 10 minutos
        path: "/",
      });
      return res;
    }
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
