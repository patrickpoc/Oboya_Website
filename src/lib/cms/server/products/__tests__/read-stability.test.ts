import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let configured = true;
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => configured }));

type Row = { id: string; updated_at: string };
const orders: string[] = [];
let rows: Row[] = [];
let result: { data: unknown; error: unknown; count?: number } | null = null;

/** Chainable query mock that applies order/range to `rows`. */
function makeQuery() {
  const spec = { order: [] as Array<{ col: string; asc: boolean }>, range: null as null | [number, number] };
  const run = () => {
    if (result) return result;
    const sorted = [...rows].sort((a, b) => {
      for (const o of spec.order) {
        const av = a[o.col as keyof Row];
        const bv = b[o.col as keyof Row];
        if (av === bv) continue;
        return (av < bv ? -1 : 1) * (o.asc ? 1 : -1);
      }
      return 0;
    });
    const page = spec.range ? sorted.slice(spec.range[0], spec.range[1] + 1) : sorted;
    return { data: page, error: null, count: rows.length };
  };
  const q: Record<string, unknown> = {};
  const self = () => q;
  q.select = self;
  q.is = self;
  q.neq = self;
  q.eq = self;
  q.not = self;
  q.or = self;
  q.order = (col: string, o: { ascending: boolean }) => {
    orders.push(col);
    spec.order.push({ col, asc: o.ascending });
    return q;
  };
  q.range = (a: number, b: number) => {
    spec.range = [a, b];
    return q;
  };
  q.maybeSingle = () => Promise.resolve(run());
  q.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
    Promise.resolve(run()).then(res, rej);
  return q;
}

const client = {
  from: () => makeQuery(),
  rpc: () => Promise.resolve({ data: [{ total: 0, active: 0, draft: 0 }], error: null }),
};
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => client,
  createPublicClient: () => client,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createServiceClient: () => client,
  isServiceRoleConfigured: () => false,
}));

const getCmsProducts = vi.fn(() => [{ id: "seed", sku: "seed" }]);
vi.mock("@/lib/cms/repositories/product-repository", () => ({
  getCmsProducts,
  isProductPurgeDue: () => false,
  purgeExpiredCmsProducts: () => 0,
}));
vi.mock("@/lib/cms/server/products/row.server", () => ({
  CATALOG_READ_TAGS: [],
  PRODUCT_LIST_COLUMNS: "*",
  PRODUCT_TABLE_COLUMNS: "*",
  OPTIONAL_COLUMN_RETRIES: 0,
  disableMissingOptionalColumn: () => false,
  withoutDisabledColumns: (c: string) => c,
  rowToProduct: (r: Row) => ({ id: r.id, sku: r.id, status: "published", name: {} }),
}));
vi.mock("@/lib/cms/server/products/writes.server", () => ({
  persistProductsToFileSafe: vi.fn(),
}));
vi.mock("@/lib/cms/cache-tags", () => ({ ALL_PRODUCTS_TAG: "all", productTag: (id: string) => id }));

beforeEach(() => {
  configured = true;
  orders.length = 0;
  result = null;
  getCmsProducts.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("product reads are deterministic and never fall back to seed", () => {
  it("pages 133 rows with the same updated_at without gaps or duplicates", async () => {
    rows = Array.from({ length: 133 }, (_, i) => ({
      id: `p${String(i).padStart(3, "0")}`,
      updated_at: "2026-11-24T00:00:00Z",
    }));
    const { readProductsPage } = await import("../page.server");
    const runAll = async () => {
      const out: string[][] = [];
      for (let page = 1; page <= 7; page++) {
        const res = await readProductsPage({ page, limit: 20, tab: "all", fields: "list" });
        out.push(res.items.map((p) => p.id));
      }
      return out;
    };
    const first = await runAll();
    expect(await runAll()).toEqual(first);
    expect(await runAll()).toEqual(first);
    const seen = first.flat();
    const pages = first.length;
    expect(pages).toBe(7);
    expect(seen).toHaveLength(133);
    expect(new Set(seen).size).toBe(133);
    expect(orders.slice(0, 2)).toEqual(["updated_at", "id"]);
  });

  it("readProducts rejects with CmsReadError and logs JSON on error", async () => {
    result = { data: null, error: { message: "boom" } };
    const { readProducts } = await import("../reads.server");
    await expect(
      readProducts({ skipPurge: true, source: "api/shop/catalog" })
    ).rejects.toMatchObject({ name: "CmsReadError" });
    expect(getCmsProducts).not.toHaveBeenCalled();
    const line = (console.error as unknown as ReturnType<typeof vi.fn>).mock.calls
      .map((c) => String(c[0]))
      .find((l) => l.includes("cms_read_error"));
    expect(JSON.parse(line!)).toMatchObject({
      type: "cms_read_error",
      source: "api/shop/catalog",
      reason: "error",
    });
  });

  it("readProducts logs reason timeout", async () => {
    vi.useFakeTimers();
    const origFrom = client.from;
    try {
      result = null;
      const never: Record<string, unknown> = { then: () => undefined };
      for (const m of ["select", "is", "order"]) never[m] = () => never;
      client.from = () => never as never;
      const { readProducts } = await import("../reads.server");
      const p = readProducts({ skipPurge: true, source: "t" });
      const assertion = expect(p).rejects.toMatchObject({ name: "CmsReadError" });
      await vi.advanceTimersByTimeAsync(15001);
      await assertion;
      const lines = (console.error as unknown as ReturnType<typeof vi.fn>).mock.calls.map((c) => String(c[0]));
      expect(lines.some((l) => l.includes('"reason":"timeout"'))).toBe(true);
    } finally {
      client.from = origFrom;
      vi.useRealTimers();
    }
  });

  it("readProducts({ asAdmin }) returns [] for an empty table", async () => {
    rows = [];
    const { readProducts } = await import("../reads.server");
    expect(await readProducts({ asAdmin: true, skipPurge: true })).toEqual([]);
    expect(getCmsProducts).not.toHaveBeenCalled();
  });

  it("readProducts uses the seed when Supabase is not configured", async () => {
    configured = false;
    const { readProducts } = await import("../reads.server");
    expect(await readProducts({ skipPurge: true })).toHaveLength(1);
  });

  it("readProductById and readProductSkuIndex reject on error", async () => {
    result = { data: null, error: { message: "boom" } };
    const { readProductById } = await import("../page.server");
    const { readProductSkuIndex } = await import("../reads.server");
    await expect(readProductById("x")).rejects.toMatchObject({ name: "CmsReadError" });
    await expect(readProductSkuIndex()).rejects.toMatchObject({ name: "CmsReadError" });
    expect(getCmsProducts).not.toHaveBeenCalled();
  });
});
