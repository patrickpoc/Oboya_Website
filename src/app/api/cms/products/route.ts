import { NextResponse } from "next/server";
import { getCmsProducts, saveCmsProduct, type CmsProduct } from "@/lib/cms/repositories/product-repository";
import {
  readProducts,
  saveProduct,
  persistProductsToFileSafe,
} from "@/lib/cms/server/products.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { publicApiError } from "@/lib/security/public-error";
import { toPublicProduct } from "@/lib/cms/server/public-product";

export async function GET(request: Request) {
  try {
    const includeDeleted = new URL(request.url).searchParams.get("includeDeleted") === "1";
    if (includeDeleted) {
      const auth = await cmsGuard("marketplace", "view");
      if ("response" in auth) return auth.response;
      const products = await readProducts({ includeDeleted: true, asAdmin: true });
      return NextResponse.json(products);
    }
    const products = (await readProducts({ includeDeleted: false }))
      .filter((product) => product.status === "published" && !product.deletedAt)
      .map(toPublicProduct);
    return NextResponse.json(products);
  } catch (error) {
    return publicApiError(error, "Failed to load products");
  }
}

export async function POST(request: Request) {
  try {
    const auth = await cmsGuard("marketplace", "create");
    if ("response" in auth) return auth.response;

    const body = (await request.json()) as CmsProduct;
    const { persistProductWithContent } = await import(
      "@/lib/cms/server/product-content.server"
    );
    const saved = saveCmsProduct(await persistProductWithContent(body));

    if (isSupabaseConfigured()) {
      await saveProduct(saved);
    }

    await persistProductsToFileSafe(getCmsProducts({ includeDeleted: true }));
    try {
      const { revalidateShopPages } = await import("@/lib/cms/revalidate-site");
      revalidateShopPages(saved.id);
    } catch {
      // Ignore when revalidation is unavailable.
    }
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to persist product";
    const status = /exceeds|too many images/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}