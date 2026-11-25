import { describe, expect, it, vi } from "vitest";
import { publishedProducts, requestCatalog } from "../catalog-request";

const res = (ok: boolean, body: unknown = {}) =>
  ({ ok, json: async () => body }) as Response;

describe("requestCatalog", () => {
  it("rejects on 503 so the loader reports an error with no seed products", async () => {
    const f = vi.fn().mockResolvedValue(res(false));
    await expect(requestCatalog(f, false)).rejects.toThrow();
    expect(f).toHaveBeenCalledWith("/api/shop/catalog", undefined);
  });

  it("retry bypasses caches and returns products", async () => {
    const f = vi
      .fn()
      .mockResolvedValue(
        res(true, { products: [{ id: "a", status: "published" }, { id: "b", status: "draft" }] })
      );
    const catalog = await requestCatalog(f, true);
    expect(f).toHaveBeenCalledWith("/api/shop/catalog", { cache: "no-store" });
    expect(publishedProducts(catalog.products).map((p) => p.id)).toEqual(["a"]);
  });
});
