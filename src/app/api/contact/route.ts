import { NextRequest, NextResponse } from "next/server";
import { sendContactFormEmail } from "@/lib/resend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message, reason } = body as {
      name?: string;
      email?: string;
      message?: string;
      reason?: string;
    };
    const nameStr = (name ?? "").trim();
    const emailStr = (email ?? "").trim();
    const messageStr = (message ?? "").trim();
    const reasonStr = (reason ?? "").trim();
    if (!nameStr || !emailStr || !emailStr.includes("@") || !messageStr || !reasonStr) {
      return NextResponse.json(
        { error: "Name, email, reason and message are required." },
        { status: 400 }
      );
    }
    const err = await sendContactFormEmail({
      name: nameStr,
      email: emailStr,
      reason: reasonStr,
      message: messageStr,
    });
    if (err) return NextResponse.json({ error: err.error }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
