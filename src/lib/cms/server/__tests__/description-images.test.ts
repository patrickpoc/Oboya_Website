import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => true }));

const removeMediaAsset = vi.fn();
vi.mock("@/lib/cms/server/media-upload.server", () => ({ removeMediaAsset }));
vi.mock("@/lib/cms/repositories/media-repository", () => ({ getMediaAssets: () => [] }));
vi.mock("@/lib/cms/server/media-library.server", () => ({
  listMediaLibrary: async () => [
    { id: "a1", url: "/img/a.png", folder: "product-descriptions" },
    { id: "a2", url: "/img/b.png", folder: "product-descriptions" },
  ],
}));
vi.mock("@/lib/cms/media-folder-ids", () => ({ FOLDER_PRODUCT_DESCRIPTIONS: "product-descriptions" }));
let others: Array<{ id: string; description: Record<string, string> }> | Error = [];
vi.mock("@/lib/cms/server/products.server", () => ({
  readProductDescriptionsStrict: async () => {
    if (others instanceof Error) throw others;
    return others;
  },
}));

const html = (...urls: string[]) => ({
  en: urls.map((u) => `<img src="${u}">`).join(""), "pt-BR": "", es: "", "zh-CN": "",
});

describe("reconcileDescriptionImages", () => {
  beforeEach(() => {
    removeMediaAsset.mockReset();
    others = [];
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("removes images no product references", async () => {
    const { reconcileDescriptionImages } = await import("@/lib/cms/product-description-images");
    await reconcileDescriptionImages({ productId: "p", previous: html("/img/a.png"), next: html() });
    expect(removeMediaAsset).toHaveBeenCalledWith({ id: "a1", url: "/img/a.png" });
  });

  it("keeps a URL still used by another or a trashed product", async () => {
    others = [{ id: "other", description: html("/img/a.png") }, { id: "trash", description: html("/img/b.png") }];
    const { reconcileDescriptionImages } = await import("@/lib/cms/product-description-images");
    await reconcileDescriptionImages({ productId: "p", previous: html("/img/a.png", "/img/b.png"), next: html() });
    expect(removeMediaAsset).not.toHaveBeenCalled();
  });

  it("keeps an image the next description references by an absolute URL or with a query string", async () => {
    const { reconcileDescriptionImages } = await import("@/lib/cms/product-description-images");
    await reconcileDescriptionImages({
      productId: "p",
      previous: html("/img/a.png", "/img/b.png"),
      next: html("https://cdn.example.com/img/a.png", "/img/b.png?v=2"),
    });
    expect(removeMediaAsset).not.toHaveBeenCalled();
  });

  it("keeps an image another product references with a query string or absolute URL", async () => {
    others = [{ id: "other", description: html("https://cdn.example.com/img/a.png?x=1") }];
    const { reconcileDescriptionImages } = await import("@/lib/cms/product-description-images");
    await reconcileDescriptionImages({ productId: "p", previous: html("/img/a.png"), next: html() });
    expect(removeMediaAsset).not.toHaveBeenCalled();
  });

  it("deletes nothing when the reference read fails", async () => {
    others = new Error("down");
    const { reconcileDescriptionImages } = await import("@/lib/cms/product-description-images");
    await reconcileDescriptionImages({ productId: "p", previous: html("/img/a.png"), next: html() });
    expect(removeMediaAsset).not.toHaveBeenCalled();
  });
});

describe("writeProduct image cleanup ordering", () => {
  it("leaves images untouched when the upsert fails", async () => {
    vi.resetModules();
    const reconcile = vi.fn();
    vi.doMock("@/lib/cms/server/product-content.server", () => ({
      persistProductWithContent: async (p: unknown) => p,
      reconcileProductImages: reconcile,
    }));
    vi.doMock("@/lib/cms/server/products.server", () => ({
      findExistingProduct: vi.fn(),
      hardDeleteProduct: vi.fn(),
      persistProductsToFileSafe: vi.fn(),
      restoreProduct: vi.fn(),
      saveProduct: async () => {
        throw new Error("upsert failed");
      },
      softDeleteProduct: vi.fn(),
    }));
    vi.doMock("@/lib/cms/server/cache-invalidation.server", () => ({
      invalidateProducts: vi.fn(),
      invalidateCatalog: vi.fn(),
    }));
    vi.doMock("@/lib/cms/repositories/product-repository", () => ({
      getCmsProducts: () => [],
      hardDeleteCmsProduct: vi.fn(),
      restoreCmsProduct: vi.fn(),
      saveCmsProduct: (p: unknown) => p,
      softDeleteCmsProduct: vi.fn(),
    }));
    const { writeProduct } = await import("@/lib/cms/server/product-writes.server");
    await expect(
      writeProduct({ id: "p", sku: "S" } as never, { id: "p", sku: "S" } as never)
    ).rejects.toThrow("upsert failed");
    expect(reconcile).not.toHaveBeenCalled();
  });
});
