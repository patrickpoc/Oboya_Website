import { NextResponse } from "next/server";
import {
  getCmsProducts,
  saveCmsProduct,
  type CmsProduct,
} from "@/lib/cms/repositories/product-repository";
import {
  persistProductsToFileSafe,
  readProductById,
  saveProduct,
} from "@/lib/cms/server/products.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { validateColorVariants } from "@/lib/shop/color-variants";
import { displayProductName } from "@/lib/cms/bulk-update/search-products";
import type { BulkApplyResult } from "@/lib/cms/bulk-update/types";
import { BULK_UPDATE_MAX_PRODUCTS } from "@/lib/cms/bulk-update/types";
import { logCmsPerf } from "@/lib/cms/server/perf-log.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BULK_CAP = BULK_UPDATE_MAX_PRODUCTS;

type BulkMode = "update" | "create";

type BulkBody = {
  mode?: BulkMode;
  products?: CmsProduct[];
};

/**
 * Batch create/update products in one request (single auth + one shop revalidate).
 */
export async function POST(request: Request) {
  const started = Date.now();
  try {
    const body = (await request.json()) as BulkBody;
    const mode: BulkMode = body.mode === "create" ? "create" : "update";
    const auth = await cmsGuard(
      "marketplace",
      mode === "create" ? "create" : "edit"
    );
    if ("response" in auth) return auth.response;

    const products = Array.isArray(body.products) ? body.products : [];
    if (products.length === 0) {
      return NextResponse.json(
        { error: "products array is required" },
        { status: 400 }
      );
    }
    if (products.length > BULK_CAP) {
      return NextResponse.json(
        {
          error: `At most ${BULK_CAP} products per bulk request`,
        },
        { status: 400 }
      );
    }

    const { persistProductWithContent } = await import(
      "@/lib/cms/server/product-content.server"
    );

    const results: BulkApplyResult[] = [];
    let wroteAny = false;

    for (const product of products) {
      if (!product?.id || !product?.sku) {
        results.push({
          productId: product?.id ?? "",
          sku: product?.sku ?? "",
          name: product ? displayProductName(product) : "",
          status: "FAILED",
          error: "Product id and sku are required",
          suggestedAction: "Fix the product data and try again.",
        });
        continue;
      }

      const variantError = validateColorVariants(product.colorVariants, {
        defaultColor: product.defaultColor,
        defaultColorName: product.defaultColorName,
      });
      if (variantError && (product.colorVariants?.length ?? 0) > 0) {
        results.push({
          productId: product.id,
          sku: product.sku,
          name: displayProductName(product),
          status: "FAILED",
          error: variantError,
          field: "colorVariants",
          suggestedAction: "Fix color variant data and try again.",
        });
        continue;
      }

      try {
        const previous =
          mode === "update"
            ? await readProductById(product.id, { asAdmin: true })
            : null;
        if (mode === "update" && !previous) {
          results.push({
            productId: product.id,
            sku: product.sku,
            name: displayProductName(product),
            status: "FAILED",
            error: "Product not found",
            suggestedAction: "Refresh the catalog and try again.",
          });
          continue;
        }

        const saved = saveCmsProduct(
          await persistProductWithContent(product, previous ?? undefined)
        );

        if (isSupabaseConfigured()) {
          await saveProduct(saved);
        }

        wroteAny = true;
        results.push({
          productId: saved.id,
          sku: saved.sku,
          name: displayProductName(saved),
          status: "SUCCESS",
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to persist product";
        results.push({
          productId: product.id,
          sku: product.sku,
          name: displayProductName(product),
          status: "FAILED",
          error: message,
          suggestedAction: "Fix the product data and try again.",
        });
      }
    }

    if (wroteAny) {
      await persistProductsToFileSafe(getCmsProducts({ includeDeleted: true }));
      try {
        const { revalidateShopPages } = await import(
          "@/lib/cms/revalidate-site"
        );
        revalidateShopPages();
      } catch {
        // Ignore when revalidation is unavailable.
      }
    }

    const ok = results.filter((r) => r.status === "SUCCESS").length;
    const failed = results.filter((r) => r.status === "FAILED").length;
    logCmsPerf("POST /api/cms/products/bulk", started, {
      mode,
      count: products.length,
      ok,
      failed,
    });

    return NextResponse.json({ results, ok, failed });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to bulk persist products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
