import { NextRequest, NextResponse } from "next/server";
import { createServerAdminClient } from "@/lib/supabase/server-admin";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Ipaper123!";
const BUCKET = "product-images";
const MAX_FILES = 5;

/** Sanitize filename for storage path: preserves extension, safe chars only. */
function safeName(fileName: string): string {
  const ext = (fileName.split(".").pop() || "jpg").replace(/[^a-zA-Z0-9]/g, "").slice(0, 5) || "jpg";
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);
  return (base || "image") + "." + ext;
}

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "") || request.cookies.get("admin_token")?.value;
  return token === ADMIN_PASSWORD;
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("images") as File[];
    if (!files?.length || files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Send between 1 and ${MAX_FILES} images` },
        { status: 400 }
      );
    }

    const supabase = createServerAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY not set. Add it to .env.local for uploads." },
        { status: 500 }
      );
    }
    const base = `${Date.now()}`;
    const urls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!(file instanceof File) || !file.size) continue;
      const path = `${base}-${i}-${safeName(file.name)}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }

    if (urls.length === 0) {
      return NextResponse.json({ error: "No valid images" }, { status: 400 });
    }

    // These public URLs are saved in products.images by the admin form when saving the product.
    return NextResponse.json({ urls });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
