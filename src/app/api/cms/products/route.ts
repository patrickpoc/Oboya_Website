import { NextResponse } from "next/server";
import { getCmsProducts, saveCmsProduct, type CmsProduct } from "@/lib/cms/repositories/product-repository";
import {
  readProducts,
  saveProduct,
  persistProductsToFileSafe,
} from "@/lib/cms/server/products.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdminUser } from "@/lib/map-locations.server";

export async function GET(request: Request) {
  try {
    const includeDeleted = new URL(request.url).searchParams.get("includeDeleted") === "1";
    const asAdmin = includeDeleted && isSupabaseConfigured();
    if (asAdmin) {
      const user = await requireAdminUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    const products = await readProducts({ includeDeleted, asAdmin });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load products",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (isSupabaseConfigured()) {
      const user = await requireAdminUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = (await request.json()) as CmsProduct;
    const { persistProductWithContent } = await import(
      "@/lib/cms/server/product-content.server"
    );
    const saved = saveCmsProduct(await persistProductWithContent(body));

    if (isSupabaseConfigured()) {
      await saveProduct(saved);
    }

    await persistProductsToFileSafe(getCmsProducts({ includeDeleted: true }));
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to persist product";
    const status = /exceeds|too many images/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}