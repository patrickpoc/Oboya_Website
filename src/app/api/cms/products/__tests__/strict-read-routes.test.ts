import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => true }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/cms/server/cms-document.server", () => ({
  cmsDocumentFilePath: () => "",
  readCmsDocumentSeedFile: async () => null,
}));

const readProductByIdStrict = vi.fn();
const readProductById = vi.fn();
const readProductsStrict = vi.fn();
const saveProduct = vi.fn();
vi.mock("@/lib/cms/server/products.server", () => ({
  readProductById,
  readProductByIdStrict,
  readProductsStrict,
  readProducts: vi.fn(),
  readProductsPage: vi.fn(),
  readProductSkuIndex: vi.fn(),
  findExistingProduct: vi.fn(),
  persistProductsToFileSafe: vi.fn(),
  saveProduct,
}));

let guard: unknown = { user: { id: "u1" } };
vi.mock("@/lib/cms/server/require-cms-auth", () => ({
  cmsGuard: async () => guard,
  requireCmsAuth: async () => ({ ok: true, user: { id: "u1" } }),
}));
const writeProduct = vi.fn();
vi.mock("@/lib/cms/server/product-writes.server", () => ({
  writeProduct,
  mergeProductUpdate: (a: unknown) => a,
  deleteProductWrite: vi.fn(),
  restoreProductWrite: vi.fn(),
  assertProductIsNew: vi.fn(),
  assertVariantChangesValid: vi.fn(),
  VariantValidationError: class extends Error {},
  createProductWrite: vi.fn(),
  ProductExistsError: class extends Error {},
}));
vi.mock("@/lib/cms/server/approvals.server", () => ({
  requiresApprovalFor: async () => false,
  submitOrApply: async (input: { apply: () => Promise<unknown> }) => ({
    applied: true,
    result: await input.apply(),
  }),
  submitChangeRequest: vi.fn(),
  pendingApprovalResponse: vi.fn(),
  stripApprovalMeta: (x: unknown) => x,
  toPendingInfo: vi.fn(),
  submitBulkUpdateRequest: vi.fn(),
}));
vi.mock("@/lib/cms/server/bulk-approval.server", () => ({ submitBulkUpdateRequest: vi.fn() }));
vi.mock("@/lib/cms/server/product-content.server", () => ({
  persistProductWithContent: async (p: unknown) => p,
  reconcileProductImages: vi.fn(),
}));
vi.mock("@/lib/cms/server/cache-invalidation.server", () => ({
  invalidateCatalog: vi.fn(),
  invalidateProducts: vi.fn(),
}));
vi.mock("@/lib/cms/repositories/product-repository", () => ({
  getCmsProducts: () => [],
  saveCmsProduct: (p: unknown) => p,
}));
vi.mock("@/lib/cms/server/perf-log.server", () => ({ logCmsPerf: vi.fn() }));
vi.mock("@/lib/cms/revalidate-site", () => ({ shouldDeferRevalidate: () => false }));

async function readError() {
  const { CmsReadError } = await import("@/lib/cms/server/strict-read");
  return new CmsReadError("secret db text");
}

const ctx = { params: Promise.resolve({ id: "p1" }) };

describe("product routes fail closed on a baseline read error", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    guard = { user: { id: "u1" } };
    vi.spyOn(console, "error").mockImplementation(() => {});
    const error = await readError();
    readProductByIdStrict.mockRejectedValue(error);
    readProductsStrict.mockRejectedValue(error);
  });

  it("GET [id] returns 503 for admins", async () => {
    const { GET } = await import("../[id]/route");
    const res = await GET(new Request("http://x/api/cms/products/p1"), ctx);
    expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).not.toContain("secret");
  });

  it("PUT [id] returns 503 and writes nothing", async () => {
    const { PUT } = await import("../[id]/route");
    const res = await PUT(
      new Request("http://x/api/cms/products/p1", {
        method: "PUT",
        body: JSON.stringify({ id: "p1", sku: "S" }),
      }),
      ctx
    );
    expect(res.status).toBe(503);
    expect(writeProduct).not.toHaveBeenCalled();
  });

  it("POST returns 503 without database text when the existence check cannot read", async () => {
    const { assertProductIsNew } = await import("@/lib/cms/server/product-writes.server");
    vi.mocked(assertProductIsNew).mockRejectedValueOnce(await readError());
    const { POST } = await import("../route");
    const res = await POST(
      new Request("http://x/api/cms/products", { method: "POST", body: JSON.stringify({ id: "p1", sku: "S" }) })
    );
    expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).not.toContain("secret");
  });

  it("bulk create returns 503 when the existence check cannot read", async () => {
    const { findExistingProduct } = await import("@/lib/cms/server/products.server");
    vi.mocked(findExistingProduct).mockRejectedValueOnce(await readError());
    const { POST } = await import("../bulk/route");
    const res = await POST(
      new Request("http://x/api/cms/products/bulk", {
        method: "POST",
        body: JSON.stringify({ mode: "create", products: [{ id: "n", sku: "N" }] }),
      })
    );
    expect(res.status).toBe(503);
    expect(saveProduct).not.toHaveBeenCalled();
  });

  it("bulk create checks every row before the first write and rejects in-batch duplicates", async () => {
    const { findExistingProduct } = await import("@/lib/cms/server/products.server");
    vi.mocked(findExistingProduct)
      .mockReset()
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(await readError());
    const { POST } = await import("../bulk/route");
    const body = (products: unknown[]) =>
      new Request("http://x/api/cms/products/bulk", {
        method: "POST",
        body: JSON.stringify({ mode: "create", products }),
      });
    const res = await POST(body([{ id: "a", sku: "A" }, { id: "b", sku: "B" }]));
    expect(res.status).toBe(503);
    expect(saveProduct).not.toHaveBeenCalled();

    vi.mocked(findExistingProduct).mockReset().mockResolvedValue(null);
    const dup = await POST(body([{ id: "a", sku: "A" }, { id: "c", sku: "A" }]));
    const json = await dup.json();
    expect(json.ok).toBe(1);
    expect(json.failed).toBe(1);
    expect(saveProduct).toHaveBeenCalledTimes(1);
  });

  it("DELETE [id] returns 503", async () => {
    const { DELETE } = await import("../[id]/route");
    const res = await DELETE(new Request("http://x/api/cms/products/p1", { method: "DELETE" }), ctx);
    expect(res.status).toBe(503);
  });

  it("bulk update returns 503 with nothing written when a later baseline read fails", async () => {
    readProductByIdStrict
      .mockReset()
      .mockResolvedValueOnce({ id: "a", sku: "A" })
      .mockRejectedValueOnce(await readError());
    const { POST } = await import("../bulk/route");
    const res = await POST(
      new Request("http://x/api/cms/products/bulk", {
        method: "POST",
        body: JSON.stringify({
          mode: "update",
          products: [
            { id: "a", sku: "A", status: "draft" },
            { id: "b", sku: "B", status: "draft" },
          ],
        }),
      })
    );
    expect(res.status).toBe(503);
    expect(saveProduct).not.toHaveBeenCalled();
  });

  it("GET ?includeDeleted=1&forEdit=1 is strict (503) and unauthenticated gets the guard response", async () => {
    const { GET } = await import("../route");
    const url = "http://x/api/cms/products?includeDeleted=1&fields=list&forEdit=1";
    expect((await GET(new Request(url))).status).toBe(503);
    const { NextResponse } = await import("next/server");
    guard = { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    expect((await GET(new Request(url))).status).toBe(401);
    expect(readProductsStrict).toHaveBeenCalledTimes(1);
  });
});
