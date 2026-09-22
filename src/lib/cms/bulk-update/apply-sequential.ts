import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import { applyPatchToProduct, buildPatchFromPending } from "@/lib/cms/bulk-update/diff";
import { displayProductName } from "@/lib/cms/bulk-update/search-products";
import type {
  BulkApplyResult,
  BulkWorkspaceRow,
} from "@/lib/cms/bulk-update/types";

export type SequentialApplyProgress = {
  index: number;
  total: number;
  current?: BulkWorkspaceRow;
  lastResult?: BulkApplyResult;
};

/**
 * Sequentially PUT each product that has pending changes.
 * Products with no changes are SKIPPED.
 */
export async function applyBulkUpdatesSequentially(params: {
  rows: BulkWorkspaceRow[];
  onProgress?: (progress: SequentialApplyProgress) => void;
}): Promise<BulkApplyResult[]> {
  const { rows, onProgress } = params;
  const withChanges = rows.filter((row) => row.changedFields.length > 0);
  const results: BulkApplyResult[] = [];

  // Mark unchanged as skipped in final report
  for (const row of rows) {
    if (row.changedFields.length > 0) continue;
    results.push({
      productId: row.productId,
      sku: row.pending.sku,
      name: displayProductName(row.pending),
      status: "SKIPPED",
    });
  }

  for (let index = 0; index < withChanges.length; index += 1) {
    const row = withChanges[index];
    onProgress?.({
      index: index + 1,
      total: withChanges.length,
      current: row,
    });

    const patch = buildPatchFromPending(row.original, row.pending);
    const body: CmsProduct = applyPatchToProduct(row.original, patch);

    try {
      const response = await fetch(`/api/cms/products/${row.productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        const result: BulkApplyResult = {
          productId: row.productId,
          sku: row.pending.sku,
          name: displayProductName(row.pending),
          status: "FAILED",
          error: payload?.error || `HTTP ${response.status}`,
          suggestedAction: "Fix the product data and try again.",
        };
        results.push(result);
        onProgress?.({
          index: index + 1,
          total: withChanges.length,
          current: row,
          lastResult: result,
        });
        continue;
      }

      const result: BulkApplyResult = {
        productId: row.productId,
        sku: row.pending.sku,
        name: displayProductName(row.pending),
        status: "SUCCESS",
      };
      results.push(result);
      onProgress?.({
        index: index + 1,
        total: withChanges.length,
        current: row,
        lastResult: result,
      });
    } catch (error) {
      const result: BulkApplyResult = {
        productId: row.productId,
        sku: row.pending.sku,
        name: displayProductName(row.pending),
        status: "FAILED",
        error: error instanceof Error ? error.message : "Network error",
        suggestedAction: "Check your connection and retry failed products.",
      };
      results.push(result);
      onProgress?.({
        index: index + 1,
        total: withChanges.length,
        current: row,
        lastResult: result,
      });
    }
  }

  return results;
}
