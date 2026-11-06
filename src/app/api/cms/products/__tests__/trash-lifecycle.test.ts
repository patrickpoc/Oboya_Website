import { beforeEach, describe, expect, it, vi } from "vitest";

// Real product-repository and product-writes: only the database edge is mocked.
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => true }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const readProductByIdStrict = vi.fn();
const saveProduct = vi.fn();
const restoreProduct = vi.fn();
vi.mock("@/lib/cms/server/products.server", () => ({
  readProductByIdStrict,
  findExistingProduct: vi.fn(async () => null),
  persistProductsToFileSafe: vi.fn(),
  hardDeleteProduct: vi.fn(),
  softDeleteProduct: vi.fn(),
  restoreProduct,
  saveProduct,
}));

const order: string[] = [];
const reconcileProductImages = vi.fn(async () => {
  order.push("reconcile");
});
vi.mock("@/lib/cms/server/product-content.server", () => ({
  persistProductWithContent: async (p: unknown) => p,
  reconcileProductImages,
}));
vi.mock("@/lib/cms/server/cache-invalidation.server", () => ({
  invalidateCatalog: vi.fn(),
  invalidateProducts: vi.fn(() => order.push("invalidate")),
}));
vi.mock("@/lib/cms/server/require-cms-auth", () => ({
  cmsGuard: async () => ({ user: { id: "u1" } }),
}));
vi.mock("@/lib/cms/server/approvals.server", () => ({
  requiresApprovalFor: async () => false,
  submitChangeRequest: vi.fn(),
  pendingApprovalResponse: vi.fn(),
  toPendingInfo: vi.fn(),
}));
vi.mock("@/lib/cms/server/bulk-approval.server", () => ({ submitBulkUpdateRequest: vi.fn() }));
vi.mock("@/lib/cms/server/perf-log.server", () => ({ logCmsPerf: vi.fn() }));

const DELETED_AT = "2026-11-01T00:00:00.000Z";
const PURGE_AT = "2099-11-02T00:00:00.000Z";

async function trashFirstProduct() {
  const repo = await import("@/lib/cms/repositories/product-repository");
  const first = repo.getCmsProducts()[0];
  repo.saveCmsProduct({ ...first, deletedAt: DELETED_AT, purgeAt: PURGE_AT });
  return { repo, id: first.id, sku: first.sku };
}

describe("trash fields on a real repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    order.length = 0;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("PUT-style writeProduct keeps deletedAt and purgeAt despite a stale payload; restore clears them", async () => {
    const { repo, id } = await trashFirstProduct();
    const previous = repo.getCmsProductById(id)!;
    const { writeProduct, restoreProductWrite } = await import("@/lib/cms/server/product-writes.server");
    const saved = await writeProduct({ ...previous, deletedAt: null, purgeAt: null }, previous);
    expect(saved).toMatchObject({ deletedAt: DELETED_AT, purgeAt: PURGE_AT });
    expect(saveProduct).toHaveBeenCalledWith(expect.objectContaining({ deletedAt: DELETED_AT, purgeAt: PURGE_AT }));
    expect(repo.getCmsProductById(id)).toMatchObject({ deletedAt: DELETED_AT, purgeAt: PURGE_AT });

    await restoreProductWrite(id);
    expect(repo.getCmsProductById(id)).toMatchObject({ deletedAt: null, purgeAt: null });
  });

  it("bulk update keeps trash fields; invalidates before reconciling images", async () => {
    const { repo, id, sku } = await trashFirstProduct();
    readProductByIdStrict.mockResolvedValue(repo.getCmsProductById(id));
    const { POST } = await import("../bulk/route");
    const res = await POST(
      new Request("http://x/api/cms/products/bulk", {
        method: "POST",
        body: JSON.stringify({ mode: "update", products: [{ id, sku, deletedAt: null, purgeAt: null }] }),
      })
    );
    expect((await res.json()).ok).toBe(1);
    expect(repo.getCmsProductById(id)).toMatchObject({ deletedAt: DELETED_AT, purgeAt: PURGE_AT });
    expect(saveProduct).toHaveBeenCalledWith(expect.objectContaining({ deletedAt: DELETED_AT }));
    expect(order.indexOf("invalidate")).toBeLessThan(order.indexOf("reconcile"));
    expect(reconcileProductImages).toHaveBeenCalledTimes(1);
  });

  it("bulk update does not clean images when the upsert fails", async () => {
    const { repo, id, sku } = await trashFirstProduct();
    readProductByIdStrict.mockResolvedValue(repo.getCmsProductById(id));
    saveProduct.mockRejectedValueOnce(new Error("upsert failed"));
    const { POST } = await import("../bulk/route");
    const res = await POST(
      new Request("http://x/api/cms/products/bulk", {
        method: "POST",
        body: JSON.stringify({ mode: "update", products: [{ id, sku }] }),
      })
    );
    expect((await res.json()).failed).toBe(1);
    expect(reconcileProductImages).not.toHaveBeenCalled();
  });
});
