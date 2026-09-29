import { NextResponse } from "next/server";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import {
  readProducts,
  readProductsPage,
  readProductSkuIndex,
  type ProductReadFields,
} from "@/lib/cms/server/products.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import {
  assertProductIsNew,
  createProductWrite,
  ProductExistsError,
} from "@/lib/cms/server/product-writes.server";
import {
  pendingApprovalResponse,
  stripApprovalMeta,
  submitOrApply,
} from "@/lib/cms/server/approvals.server";
import { diffJson } from "@/lib/cms/approvals/diff";
import { displayProductName } from "@/lib/cms/bulk-update/search-products";
import { publicApiError } from "@/lib/security/public-error";
import { toPublicProduct } from "@/lib/cms/server/public-product";
import { noStoreHeaders } from "@/lib/security/http-cache";
import { shouldDeferRevalidate } from "@/lib/cms/revalidate-site";
import { logCmsPerf } from "@/lib/cms/server/perf-log.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseFields(raw: string | null): ProductReadFields | "skus" {
  if (raw === "table" || raw === "list" || raw === "full" || raw === "skus") {
    return raw;
  }
  return "full";
}

export async function GET(request: Request) {
  const started = Date.now();
  try {
    const url = new URL(request.url);
    const includeDeleted = url.searchParams.get("includeDeleted") === "1";
    const fields = parseFields(url.searchParams.get("fields"));
    const pageRaw = url.searchParams.get("page");
    const wantsPage = pageRaw !== null && pageRaw !== "";

    if (fields === "skus" || includeDeleted || wantsPage) {
      const auth = await cmsGuard("marketplace", "view");
      if ("response" in auth) return auth.response;

      if (fields === "skus") {
        const index = await readProductSkuIndex({ asAdmin: true });
        const skus: string[] = [];
        for (const row of index) {
          if (row.id) skus.push(row.id.toLowerCase());
          if (row.sku) skus.push(row.sku.toLowerCase());
          for (const child of row.variantSkus) {
            skus.push(child.toLowerCase());
          }
        }
        logCmsPerf("GET /api/cms/products?fields=skus", started, {
          count: skus.length,
          products: index.length,
        });
        return NextResponse.json(
          { skus: Array.from(new Set(skus)) },
          { headers: noStoreHeaders }
        );
      }

      if (wantsPage) {
        const result = await readProductsPage({
          asAdmin: true,
          fields: fields === "full" ? "table" : fields,
          page: Number(pageRaw) || 1,
          limit: Number(url.searchParams.get("limit") || 20) || 20,
          tab:
            (url.searchParams.get("tab") as
              | "active"
              | "archived"
              | "trash"
              | "all"
              | null) || "active",
          q: url.searchParams.get("q") ?? "",
        });
        logCmsPerf("GET /api/cms/products?page", started, {
          total: result.total,
          items: result.items.length,
        });
        return NextResponse.json(result, { headers: noStoreHeaders });
      }

      const products = await readProducts({
        includeDeleted: true,
        asAdmin: true,
        fields,
        skipPurge: true,
      });
      logCmsPerf("GET /api/cms/products?includeDeleted", started, {
        count: products.length,
        fields,
      });
      return NextResponse.json(products, { headers: noStoreHeaders });
    }

    const products = (
      await readProducts({
        includeDeleted: false,
        fields: fields === "full" ? "list" : fields,
        skipPurge: true,
      })
    )
      .filter((product) => product.status === "published" && !product.deletedAt)
      .map(toPublicProduct);
    logCmsPerf("GET /api/cms/products public", started, {
      count: products.length,
      fields,
    });
    return NextResponse.json(products, { headers: noStoreHeaders });
  } catch (error) {
    return publicApiError(error, "Failed to load products");
  }
}

export async function POST(request: Request) {
  try {
    const auth = await cmsGuard("marketplace", "create");
    if ("response" in auth) return auth.response;

    const body = stripApprovalMeta((await request.json()) as CmsProduct);
    if (!body?.id || !body?.sku) {
      return NextResponse.json({ error: "Product id and SKU are required" }, { status: 400 });
    }
    const deferRevalidate = shouldDeferRevalidate(request);
    await assertProductIsNew(body);
    const gate = await submitOrApply({
      user: auth.user,
      changeType: "marketplace.product_create",
      entityId: body.id,
      entityLabel: [body.sku || body.id, displayProductName(body)].filter(Boolean).join(" · "),
      action: "create",
      payload: body,
      snapshot: null,
      diff: () => ({ entries: diffJson(null, body, "", [], 40) }),
      summary: `New product ${body.sku || body.id}`,
      apply: () => createProductWrite(body, { deferRevalidate }),
    });
    if (!gate.applied) return pendingApprovalResponse(gate.request, body);
    return NextResponse.json(gate.result, { status: 201 });
  } catch (error) {
    if (error instanceof ProductExistsError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Failed to persist product";
    const status = /exceeds|too many images/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
