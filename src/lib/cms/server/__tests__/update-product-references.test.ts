import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => true }));
vi.mock("@/lib/cms/server/local-fs.server", () => ({ writeLocalJsonFile: vi.fn() }));
vi.mock("@/lib/cms/repositories/product-repository", () => ({ getCmsProducts: () => [] }));

const update = vi.fn();
let rowsFor: (id: string) => { data: unknown; error: { message: string } | null };
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({
      update: (columns: unknown) => {
        update(columns);
        return { eq: (_c: string, id: string) => ({ select: async () => rowsFor(id) }) };
      },
    }),
  }),
}));

describe("updateProductReferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rowsFor = (id) => ({ data: [{ id }], error: null });
  });

  it("maps reference fields to columns and never writes description", async () => {
    const { updateProductReferences } = await import("../products/writes.server");
    const res = await updateProductReferences([
      {
        id: "p1",
        patch: { categoryId: "c", subcategoryId: "s", countryOfOrigin: "br", application: ["a"] },
      },
    ]);
    expect(res).toEqual({ updated: ["p1"], failed: [] });
    expect(update).toHaveBeenCalledWith({
      category_id: "c",
      subcategory_id: "s",
      country_of_origin: "br",
      application: ["a"],
    });
  });

  it("treats zero updated rows and errors as failures, skips non-column patches", async () => {
    rowsFor = (id) =>
      id === "gone" ? { data: [], error: null } : id === "bad" ? { data: null, error: { message: "x" } } : { data: [{ id }], error: null };
    const { updateProductReferences } = await import("../products/writes.server");
    const res = await updateProductReferences([
      { id: "gone", patch: { cultures: ["b"] } },
      { id: "bad", patch: { cultures: ["b"] } },
      { id: "custom", patch: { customFilters: { g: [] } } },
    ]);
    expect(res.failed.map((f) => f.id).sort()).toEqual(["bad", "gone"]);
    expect(res.updated).toEqual(["custom"]);
    expect(update).toHaveBeenCalledTimes(2);
  });

  it("returns {updated, failed} when a row throws or the client cannot be created", async () => {
    rowsFor = (id) => {
      if (id === "boom") throw new Error("network");
      return { data: [{ id }], error: null };
    };
    const { updateProductReferences } = await import("../products/writes.server");
    const res = await updateProductReferences([
      { id: "boom", patch: { cultures: ["b"] } },
      { id: "ok", patch: { cultures: ["b"] } },
    ]);
    expect(res.updated).toEqual(["ok"]);
    expect(res.failed).toEqual([{ id: "boom", error: "network" }]);
  });
});
