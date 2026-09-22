import { NextResponse } from "next/server";
import { buildRowsFromUpdates, validateBulkUpdate } from "@/lib/cms/bulk-update/validate";
import type {
  BulkUpdateCatalog,
  BulkValidateRequest,
} from "@/lib/cms/bulk-update/types";
import { createImportWorkspaceRow } from "@/lib/cms/bulk-import/diff";
import { validateBulkImport } from "@/lib/cms/bulk-import/validate";
import type { ImportCatalog } from "@/lib/cms/bulk-import/types";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import { getCmsProducts } from "@/lib/cms/repositories/product-repository";
import {
  readMarketplaceCurrencies,
  readMarketplaceFilters,
} from "@/lib/cms/server/marketplace-config.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { readProducts } from "@/lib/cms/server/products.server";
import { publicApiError } from "@/lib/security/public-error";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CreateValidateRequest = {
  mode: "create";
  products: CmsProduct[];
};

function isCreateRequest(body: unknown): body is CreateValidateRequest {
  return (
    typeof body === "object" &&
    body !== null &&
    (body as CreateValidateRequest).mode === "create" &&
    Array.isArray((body as CreateValidateRequest).products)
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const isCreate = isCreateRequest(body);

    const auth = await cmsGuard("marketplace", isCreate ? "create" : "edit");
    if ("response" in auth) return auth.response;

    let products = await readProducts({ includeDeleted: true });
    if (products.length === 0) {
      products = getCmsProducts({ includeDeleted: true });
    }

    const [filters, currencies] = await Promise.all([
      readMarketplaceFilters(),
      readMarketplaceCurrencies(),
    ]);

    const catalogBase: BulkUpdateCatalog = {
      categories: filters.categories,
      brands: filters.brands,
      countries: currencies.countries,
      filterOptions: filters.filterOptions,
    };

    if (isCreate) {
      const catalog: ImportCatalog = {
        ...catalogBase,
        existingIds: new Set(products.map((product) => product.id)),
        existingSkus: new Set(
          products.map((product) => product.sku.toLowerCase()).filter(Boolean)
        ),
      };
      const rows = body.products.map(createImportWorkspaceRow);
      const issues = validateBulkImport(rows, catalog);
      const blockedCount = issues.filter((issue) => issue.status === "blocked").length;
      const warningCount = issues.filter((issue) => issue.status === "warning").length;

      return NextResponse.json({
        issues,
        blockedCount,
        warningCount,
        validFieldChangeCount: Math.max(0, rows.length - blockedCount),
      });
    }

    const updateBody = body as BulkValidateRequest;
    if (!updateBody?.updates || !Array.isArray(updateBody.updates)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const productsById = new Map(products.map((product) => [product.id, product]));
    const rows = buildRowsFromUpdates(productsById, updateBody.updates);
    const issues = validateBulkUpdate(rows, catalogBase);
    const blockedCount = issues.filter((issue) => issue.status === "blocked").length;
    const warningCount = issues.filter((issue) => issue.status === "warning").length;
    const changedFieldCount = rows.reduce(
      (sum, row) => sum + row.changedFields.length,
      0
    );

    return NextResponse.json({
      issues,
      blockedCount,
      warningCount,
      validFieldChangeCount: Math.max(0, changedFieldCount - blockedCount - warningCount),
    });
  } catch (error) {
    return publicApiError(error, "Failed to validate bulk request");
  }
}
