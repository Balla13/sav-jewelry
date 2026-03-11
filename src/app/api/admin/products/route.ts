import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { Product } from "@/data/products";
import { getProductsFromSupabase } from "@/lib/supabase/products";
import {
  insertProductAdmin,
  updateProductAdmin,
  deleteProductAdmin,
} from "@/lib/supabase/products-admin";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Ipaper123!";

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "") || request.cookies.get("admin_token")?.value;
  return token === ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const products = await getProductsFromSupabase();
    return NextResponse.json(products);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      description,
      category,
      images,
      variations,
      price_usd,
      compare_at_price,
      stock_quantity,
      free_shipping,
    } = body as {
      name: string;
      description: string;
      category: Product["category"];
      images?: string[];
      variations?: string[];
      price_usd: number;
      compare_at_price?: number | null;
      stock_quantity?: number;
      free_shipping?: boolean;
    };

    if (!name?.trim() || !description?.trim() || !category || price_usd == null) {
      return NextResponse.json(
        { error: "Missing required fields: name, description, category, price_usd" },
        { status: 400 }
      );
    }

    const imageList = Array.isArray(images) && images.length > 0 ? images : [body.image].filter(Boolean);
    const image = imageList[0] || "";
    const priceUsd = Number(price_usd) || 0;

    const compareAt = compare_at_price != null && Number(compare_at_price) > 0 ? Number(compare_at_price) : undefined;
    const product: Omit<Product, "id"> = {
      name: name.trim(),
      description: description.trim(),
      category,
      image,
      images: imageList,
      variations: Array.isArray(variations) ? variations : [],
      priceUsd,
      compareAtPriceUsd: compareAt,
      stockQuantity: typeof stock_quantity === "number" ? stock_quantity : 0,
      freeShipping: free_shipping === true,
    };

    const result = await insertProductAdmin(product);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    revalidatePath("/en");
    revalidatePath("/es");
    revalidatePath("/en/collection");
    revalidatePath("/es/collection");
    return NextResponse.json({ success: true, id: result.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      id,
      price_usd,
      compare_at_price,
      stock_quantity,
      free_shipping,
      image,
      images,
      ...rest
    } = body as {
      id: string;
      price_usd?: number;
      compare_at_price?: number | null;
      stock_quantity?: number;
      free_shipping?: boolean;
      image?: string;
      images?: string[];
    } & Partial<Product>;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const update: Partial<Omit<Product, "id">> = { ...rest };
    if (price_usd != null) update.priceUsd = Number(price_usd);
    if (compare_at_price !== undefined) update.compareAtPriceUsd = compare_at_price != null && Number(compare_at_price) > 0 ? Number(compare_at_price) : undefined;
    if (typeof stock_quantity === "number" && stock_quantity >= 0) update.stockQuantity = Math.floor(stock_quantity);
    if (free_shipping !== undefined) update.freeShipping = free_shipping === true;
    if (Array.isArray(images) && images.length > 0) update.images = images;
    else if (typeof image === "string" && image.trim()) update.image = image.trim();

    const result = await updateProductAdmin(id, update);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    revalidatePath("/en");
    revalidatePath("/es");
    revalidatePath("/en/collection");
    revalidatePath("/es/collection");
    revalidatePath(`/en/product/${id}`);
    revalidatePath(`/es/product/${id}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const result = await deleteProductAdmin(id);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  revalidatePath("/en");
  revalidatePath("/es");
  revalidatePath("/en/collection");
  revalidatePath("/es/collection");
  revalidatePath(`/en/product/${id}`);
  revalidatePath(`/es/product/${id}`);
  return NextResponse.json({ success: true });
}
