import "server-only";

import type { CmsProduct } from "@/lib/cms/repositories/product-repository";
import type { CmsUser } from "@/lib/cms/types";
import type { BulkItemDiff, ChangeRequest } from "@/lib/cms/approvals/types";
import { diffJson } from "@/lib/cms/approvals/diff";
import { displayProductName } from "@/lib/cms/bulk-update/search-products";
import { readProductById } from "@/lib/cms/server/products.server";
import { submitChangeRequest } from "@/lib/cms/server/approvals.server";

export async function submitBulkUpdateRequest(
  user: CmsUser,
  products: CmsProduct[]
): Promise<ChangeRequest> {
  const snapshots: Record<string, CmsProduct | null> = {};
  const items: BulkItemDiff[] = [];
  const changed: CmsProduct[] = [];

  for (const product of products) {
    const current = (await readProductById(product.id, { asAdmin: true })) ?? null;
    const changes = diffJson(current, product, "", [], 60);
    if (current && changes.length === 0) continue;
    snapshots[product.id] = current;
    changed.push(product);
    items.push({
      productId: product.id,
      sku: product.sku,
      name: displayProductName(product),
      changes,
    });
  }

  const totalChanges = items.reduce((sum, i) => sum + i.changes.length, 0);
  const preview = items
    .slice(0, 3)
    .map((i) => i.sku || i.productId)
    .join(", ");

  return submitChangeRequest({
    user,
    changeType: "marketplace.bulk_update",
    entityId: `batch-${Date.now()}`,
    entityLabel: `${items.length} products`,
    action: "bulk",
    payload: { products: changed },
    snapshot: snapshots,
    diff: { entries: [], items },
    summary: `${items.length} products, ${totalChanges} field changes${
      preview ? ` (${preview}${items.length > 3 ? ", …" : ""})` : ""
    }`,
  });
}
