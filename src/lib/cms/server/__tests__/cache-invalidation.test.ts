import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({ revalidateTag }));

async function load() {
  return import("@/lib/cms/server/cache-invalidation.server");
}

function bustedTags() {
  return revalidateTag.mock.calls.map(([tag]) => tag);
}

describe("cache invalidation", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidateTag.mockReset();
  });

  it("expires immediately instead of serving stale content", async () => {
    const { invalidateCatalog } = await load();
    invalidateCatalog();
    expect(revalidateTag).toHaveBeenCalledWith("catalog", { expire: 0 });
  });

  it("busts each product key once (case-insensitive) plus the catalog", async () => {
    const { invalidateProducts } = await load();
    invalidateProducts(["POO1", "poo1", " Poo1 ", "SKU-9", null, undefined, ""]);
    expect(bustedTags()).toEqual(["product:poo1", "product:sku-9", "catalog"]);
  });

  it("skips the catalog for deferred batch writes", async () => {
    const { invalidateProducts } = await load();
    invalidateProducts(["A1"], { catalog: false });
    expect(bustedTags()).toEqual(["product:a1"]);
  });

  it("busts every product and the catalog for global changes", async () => {
    const { invalidateAllProducts } = await load();
    invalidateAllProducts();
    expect(bustedTags()).toEqual(["products", "catalog"]);
  });

  it("busts document and map tags", async () => {
    const { invalidateDocument, invalidateMapLocations } = await load();
    invalidateDocument("homepage");
    invalidateMapLocations();
    expect(bustedTags()).toEqual(["cms-doc:homepage", "map-locations"]);
  });

  it("never throws when called outside a request scope", async () => {
    revalidateTag.mockImplementation(() => {
      throw new Error("static generation store missing");
    });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { invalidateProducts } = await load();
    expect(() => invalidateProducts(["x"])).not.toThrow();
    spy.mockRestore();
  });
});
