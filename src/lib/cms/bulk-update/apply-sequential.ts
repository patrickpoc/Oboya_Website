import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import { productHasPendingChanges } from "@/lib/cms/bulk-update/diff";
import { displayProductName } from "@/lib/cms/bulk-update/search-products";
import type {
  BulkApplyResult,
  BulkWorkspaceRow,
} from "@/lib/cms/bulk-update/types";
import { validateColorVariants } from "@/lib/shop/color-variants";

export type SequentialApplyProgress = {
  index: number;
  total: number;
  current?: BulkWorkspaceRow;
  lastResult?: BulkApplyResult;
};

/**
 * Sequentially PUT each unique productId that has pending changes.
 * Parent + color child rows share one document — one PUT per group.
 */
export async function applyBulkUpdatesSequentially(params: {
  rows: BulkWorkspaceRow[];
  onProgress?: (progress: SequentialApplyProgress) => void;
}): Promise<BulkApplyResult[]> {
  const { rows, onProgress } = params;
  const byProduct = new Map<string, BulkWorkspaceRow[]>();
  for (const row of rows) {
    const list = byProduct.get(row.productId) ?? [];
    list.push(row);
    byProduct.set(row.productId, list);
  }

  const groups = Array.from(byProduct.entries()).map(([productId, groupRows]) => {
    const parent = groupRows.find((row) => row.kind === "parent") ?? groupRows[0]!;
    return { productId, parent, groupRows };
  });

  const results: BulkApplyResult[] = [];
  const withChanges = groups.filter(({ parent }) =>
    productHasPendingChanges(parent.original, parent.pending)
  );

  for (const { parent } of groups) {
    if (productHasPendingChanges(parent.original, parent.pending)) continue;
    results.push({
      productId: parent.productId,
      sku: parent.pending.sku,
      name: displayProductName(parent.pending),
      status: "SKIPPED",
    });
  }

  for (let index = 0; index < withChanges.length; index += 1) {
    const { parent } = withChanges[index];
    onProgress?.({
      index: index + 1,
      total: withChanges.length,
      current: parent,
    });

    const variantError = validateColorVariants(parent.pending.colorVariants, {
      defaultColor: parent.pending.defaultColor,
      defaultColorName: parent.pending.defaultColorName,
    });
    if (variantError && (parent.pending.colorVariants?.length ?? 0) > 0) {
      const result: BulkApplyResult = {
        productId: parent.productId,
        sku: parent.pending.sku,
        name: displayProductName(parent.pending),
        status: "FAILED",
        error: variantError,
        field: "colorVariants",
        suggestedAction: "Fix color variant data and try again.",
      };
      results.push(result);
      onProgress?.({
        index: index + 1,
        total: withChanges.length,
        current: parent,
        lastResult: result,
      });
      continue;
    }

    const body: CmsProduct = parent.pending;

    try {
      const response = await fetch(`/api/cms/products/${parent.productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        const result: BulkApplyResult = {
          productId: parent.productId,
          sku: parent.pending.sku,
          name: displayProductName(parent.pending),
          status: "FAILED",
          error: payload?.error || `HTTP ${response.status}`,
          suggestedAction: "Fix the product data and try again.",
        };
        results.push(result);
        onProgress?.({
          index: index + 1,
          total: withChanges.length,
          current: parent,
          lastResult: result,
        });
        continue;
      }

      const result: BulkApplyResult = {
        productId: parent.productId,
        sku: parent.pending.sku,
        name: displayProductName(parent.pending),
        status: "SUCCESS",
      };
      results.push(result);
      onProgress?.({
        index: index + 1,
        total: withChanges.length,
        current: parent,
        lastResult: result,
      });
    } catch (error) {
      const result: BulkApplyResult = {
        productId: parent.productId,
        sku: parent.pending.sku,
        name: displayProductName(parent.pending),
        status: "FAILED",
        error: error instanceof Error ? error.message : "Network error",
        suggestedAction: "Check your connection and retry failed products.",
      };
      results.push(result);
      onProgress?.({
        index: index + 1,
        total: withChanges.length,
        current: parent,
        lastResult: result,
      });
    }
  }

  return results;
}
