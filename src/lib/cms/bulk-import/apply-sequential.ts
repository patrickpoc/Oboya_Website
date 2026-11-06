import {
  copyExternalImages,
  ImageCopyError,
  importImageViaApi,
  type ImageImporter,
} from "@/lib/cms/bulk-import/import-images";
import { displayProductName } from "@/lib/cms/bulk-update/search-products";
import type {
  ImportApplyResult,
  ImportWorkspaceRow,
} from "@/lib/cms/bulk-import/types";
import { DEFER_REVALIDATE_HEADER } from "@/lib/cms/revalidate-headers";
import { BULK_APPLY_GAP_MS, sleep } from "@/lib/cms/bulk-apply-pace";

const QUIET_HEADER = "x-admin-quiet";

export type ImportApplyProgress = {
  index: number;
  total: number;
  current?: ImportWorkspaceRow;
  lastResult?: ImportApplyResult;
};

async function revalidateShopOnce() {
  try {
    await fetch("/api/cms/products/revalidate", {
      method: "POST",
      headers: { [QUIET_HEADER]: "1" },
    });
  } catch {
    // Best-effort; saves already persisted.
  }
}

/** Sequentially POST each product with a paced gap; one shop revalidate after the batch. */
export async function applyBulkImportsSequentially(params: {
  rows: ImportWorkspaceRow[];
  onProgress?: (progress: ImportApplyProgress) => void;
  gapMs?: number;
  importImage?: ImageImporter;
}): Promise<ImportApplyResult[]> {
  const { rows, onProgress } = params;
  const gapMs = params.gapMs ?? BULK_APPLY_GAP_MS;
  const importImage = params.importImage ?? importImageViaApi;
  const imageCache = new Map<string, Promise<string>>();
  const results: ImportApplyResult[] = [];
  let wroteAny = false;

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    onProgress?.({
      index: index + 1,
      total: rows.length,
      current: row,
    });

    let product = row.pending;
    try {
      product = await copyExternalImages(row.pending, importImage, imageCache);
    } catch (error) {
      const result: ImportApplyResult = {
        productId: row.productId,
        sku: row.pending.sku,
        name: displayProductName(row.pending),
        status: "FAILED",
        error: error instanceof Error ? error.message : "Could not copy the image.",
        suggestedAction:
          error instanceof ImageCopyError
            ? "The product was not created. Fix this image (or upload it) and import the row again."
            : "Retry the row.",
      };
      results.push(result);
      onProgress?.({ index: index + 1, total: rows.length, current: row, lastResult: result });
      if (index < rows.length - 1) await sleep(gapMs);
      continue;
    }

    try {
      const response = await fetch("/api/cms/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [DEFER_REVALIDATE_HEADER]: "1",
          [QUIET_HEADER]: "1",
        },
        body: JSON.stringify(product),
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
        if (index < rows.length - 1) await sleep(gapMs);
        continue;
      }

      const pendingApproval = response.status === 202;
      if (!pendingApproval) wroteAny = true;
      const result: ImportApplyResult = {
        productId: row.productId,
        sku: row.pending.sku,
        name: displayProductName(row.pending),
        status: "SUCCESS",
        ...(pendingApproval ? { pendingApproval } : {}),
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

    if (index < rows.length - 1) await sleep(gapMs);
  }

  if (wroteAny) {
    await revalidateShopOnce();
  }

  return results;
}
