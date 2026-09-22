import { displayProductName } from "@/lib/cms/bulk-update/search-products";
import type {
  ImportApplyResult,
  ImportWorkspaceRow,
} from "@/lib/cms/bulk-import/types";

export type ImportApplyProgress = {
  index: number;
  total: number;
  current?: ImportWorkspaceRow;
  lastResult?: ImportApplyResult;
};

/** Sequentially POST each product in the import workspace. */
export async function applyBulkImportsSequentially(params: {
  rows: ImportWorkspaceRow[];
  onProgress?: (progress: ImportApplyProgress) => void;
}): Promise<ImportApplyResult[]> {
  const { rows, onProgress } = params;
  const results: ImportApplyResult[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    onProgress?.({
      index: index + 1,
      total: rows.length,
      current: row,
    });

    try {
      const response = await fetch("/api/cms/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row.pending),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        const result: ImportApplyResult = {
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
          total: rows.length,
          current: row,
          lastResult: result,
        });
        continue;
      }

      const result: ImportApplyResult = {
        productId: row.productId,
        sku: row.pending.sku,
        name: displayProductName(row.pending),
        status: "SUCCESS",
      };
      results.push(result);
      onProgress?.({
        index: index + 1,
        total: rows.length,
        current: row,
        lastResult: result,
      });
    } catch (error) {
      const result: ImportApplyResult = {
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
        total: rows.length,
        current: row,
        lastResult: result,
      });
    }
  }

  return results;
}
