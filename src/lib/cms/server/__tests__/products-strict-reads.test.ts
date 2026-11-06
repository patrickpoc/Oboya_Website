import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => true }));
vi.mock("@/lib/supabase/admin", () => ({
  createServiceClient: vi.fn(),
  isServiceRoleConfigured: () => false,
}));
vi.mock("@/lib/cms/repositories/product-repository", () => ({
  getCmsProducts: () => [],
  isProductPurgeDue: (p: { purgeAt?: string | null }) => Boolean(p.purgeAt) && new Date(p.purgeAt!).getTime() <= Date.now(),
  purgeExpiredCmsProducts: () => 0,
}));
vi.mock("@/lib/cms/server/products/writes.server", () => ({ persistProductsToFileSafe: vi.fn() }));

const ranges: Array<[number, number]> = [];
const selected: string[] = [];
let table: Array<Record<string, unknown>>;
let failAt: number | null;
const cap = 3; // server returns fewer rows than the requested page size
vi.mock("@/lib/supabase/server", () => ({
  createPublicClient: vi.fn(),
  createClient: async () => ({
    from: () => ({
      select: (columns: string) => (selected.push(columns), {
        in: () => ({ limit: async () => ({ data: null, error: { message: "db secret" } }) }),
        order: () => ({
          range: async (from: number, to: number) => {
            ranges.push([from, to]);
            if (failAt !== null && from >= failAt) return { data: null, error: { message: "db secret" } };
            return { data: table.slice(from, Math.min(to + 1, from + cap)), error: null };
          },
        }),
      }),
    }),
  }),
}));

const row = (id: string, extra: Record<string, unknown> = {}) => ({
  id, sku: `S-${id}`, prices: { USD: 1 }, description: { en: id }, purge_at: null, ...extra,
});

describe("strict product reads", () => {
  beforeEach(() => {
    ranges.length = 0;
    selected.length = 0;
    failAt = null;
    table = Array.from({ length: 8 }, (_, i) => row(`p${i}`));
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("selects every column for fields=full so descriptions are real", async () => {
    const { readProductsStrict } = await import("../products/reads.server");
    await readProductsStrict("full");
    expect(new Set(selected)).toEqual(new Set(["*"]));
    selected.length = 0;
    await readProductsStrict();
    expect(selected[0]).not.toBe("*");
  });

  it("findExistingProduct throws a generic CmsReadError on a query error", async () => {
    const { findExistingProduct } = await import("../products/page.server");
    const { CmsReadError } = await import("@/lib/cms/server/strict-read");
    const error = await findExistingProduct("p1", "S1").catch((e) => e);
    expect(error).toBeInstanceOf(CmsReadError);
    expect(error.message).not.toContain("secret");
  });

  it("loses no rows when the server returns a page smaller than pageSize", async () => {
    const { readProductsStrict } = await import("../products/reads.server");
    const all = await readProductsStrict();
    expect(all.map((p) => p.id)).toEqual(table.map((r) => r.id));
    expect(ranges.map(([from]) => from)).toEqual([0, 3, 6, 8]);
  });

  it("throws CmsReadError when a later page fails", async () => {
    failAt = 3;
    const { readProductsStrict } = await import("../products/reads.server");
    const { CmsReadError } = await import("../strict-read");
    await expect(readProductsStrict()).rejects.toBeInstanceOf(CmsReadError);
  });

  it("price reader pages through trash and skips purge-due rows", async () => {
    table.push(row("trash", { purge_at: "2999-01-01T00:00:00Z" }), row("gone", { purge_at: "2000-01-01T00:00:00Z" }));
    const { readProductPricesStrict } = await import("../products/reads.server");
    const all = await readProductPricesStrict();
    expect(all.map((p) => p.id)).toContain("trash");
    expect(all.map((p) => p.id)).not.toContain("gone");
    expect(all[0]).toEqual({ id: "p0", sku: "S-p0", prices: { USD: 1 } });
  });

  it("reads descriptions strictly", async () => {
    const { readProductDescriptionsStrict } = await import("../products/reads.server");
    expect((await readProductDescriptionsStrict())[1]).toMatchObject({ id: "p1", description: { en: "p1" } });
  });
});
