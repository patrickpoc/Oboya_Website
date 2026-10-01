import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const invalidateProducts = vi.fn();
const invalidateCatalog = vi.fn();
vi.mock("@/lib/cms/server/cache-invalidation.server", () => ({
  invalidateProducts,
  invalidateCatalog,
}));

const findExistingProduct = vi.fn();
vi.mock("@/lib/cms/server/products.server", () => ({
  findExistingProduct,
  hardDeleteProduct: vi.fn(),
  persistProductsToFileSafe: vi.fn(),
  restoreProduct: vi.fn(),
  saveProduct: vi.fn(),
  softDeleteProduct: vi.fn(),
}));

vi.mock("@/lib/cms/repositories/product-repository", () => ({
  getCmsProducts: () => [],
  hardDeleteCmsProduct: vi.fn(),
  restoreCmsProduct: vi.fn(),
  saveCmsProduct: (product: unknown) => product,
  softDeleteCmsProduct: vi.fn(),
}));

vi.mock("@/lib/cms/server/product-content.server", () => ({
  persistProductWithContent: async (product: unknown) => product,
}));

vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => true }));

type Product = { id: string; sku: string };

async function load() {
  return import("@/lib/cms/server/product-writes.server");
}

describe("product write invalidation", () => {
  beforeEach(() => {
    vi.resetModules();
    invalidateProducts.mockReset();
    invalidateCatalog.mockReset();
    findExistingProduct.mockReset();
  });

  it("busts new and previous id/sku plus the catalog on a normal save", async () => {
    const { writeProduct } = await load();
    await writeProduct(
      { id: "p1", sku: "NEW-SKU" } as never,
      { id: "p1", sku: "OLD-SKU" } as never
    );
    expect(invalidateProducts).toHaveBeenCalledWith(
      ["p1", "NEW-SKU", "p1", "OLD-SKU"],
      { catalog: true }
    );
  });

  it("leaves the catalog for the batch when deferred", async () => {
    const { writeProduct } = await load();
    await writeProduct({ id: "p2", sku: "S2" } as never, null, {
      deferRevalidate: true,
    });
    expect(invalidateProducts).toHaveBeenCalledWith(
      ["p2", "S2", undefined, undefined],
      { catalog: false }
    );
  });

  it("resolves the SKU before deleting so the SKU page is busted", async () => {
    findExistingProduct.mockResolvedValue({ id: "p3", sku: "SKU-3" } satisfies Product);
    const { deleteProductWrite } = await load();
    await deleteProductWrite("p3", false);
    expect(findExistingProduct).toHaveBeenCalledWith("p3", "p3");
    expect(invalidateProducts).toHaveBeenCalledWith(["p3", "p3", "SKU-3"], {
      catalog: true,
    });
  });

  it("still busts the id when the SKU lookup fails", async () => {
    findExistingProduct.mockRejectedValue(new Error("db down"));
    const { restoreProductWrite } = await load();
    await restoreProductWrite("p4");
    expect(invalidateProducts).toHaveBeenCalledWith(["p4"], { catalog: true });
  });

  it("merges updates without wiping omitted fields", async () => {
    const { mergeProductUpdate } = await load();
    const merged = mergeProductUpdate(
      { id: "p5", sku: "S5" } as never,
      { id: "p5", sku: "OLD", description: { en: "keep" } } as never
    );
    expect(merged).toMatchObject({ sku: "S5", description: { en: "keep" } });
  });
});
