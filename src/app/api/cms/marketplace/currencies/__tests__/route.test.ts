import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const country = (code: string, active = true) => ({
  code,
  name: code,
  currencies: ["USD", "BRL"],
  defaultCurrency: "USD",
  active,
});
const current = { countries: [country("BR"), country("US")], currencies: ["USD", "BRL"] };

const saveMarketplaceCurrencies = vi.fn(async (data: unknown) => data);
const submitChangeRequest = vi.fn(async () => ({ id: "r1" }));
const requiresApprovalFor = vi.fn(async () => true);

let guard: unknown = { user: { id: "u1" } };
const readMarketplaceCurrenciesStrict = vi.fn(async () => current);
const readProductPricesStrict = vi.fn(async (): Promise<unknown[]> => []);
const readProductsStrict = vi.fn(async (): Promise<unknown[]> => []);
const readMapLocationsStrict = vi.fn(async (): Promise<unknown> => ({ locations: [] }));
vi.mock("@/lib/cms/server/require-cms-auth", () => ({
  cmsGuard: async () => guard,
}));
vi.mock("@/lib/cms/server/marketplace-config.server", () => ({
  readMarketplaceCurrencies: async () => current,
  readMarketplaceCurrenciesStrict,
  saveMarketplaceCurrencies,
}));
vi.mock("@/lib/cms/server/products.server", () => ({
  readProductPricesStrict,
  readProductsStrict,
}));
vi.mock("@/lib/map-locations.server", () => ({ readMapLocationsStrict }));
vi.mock("@/lib/cms/server/perf-log.server", () => ({ logCmsPerf: vi.fn() }));
vi.mock("@/lib/cms/server/approvals.server", () => ({
  requiresApprovalFor,
  submitChangeRequest,
  toPendingInfo: (r: unknown) => r,
  approvalErrorResponse: (e: unknown) =>
    Response.json(
      { error: String(e) },
      { status: (e as { name?: string }).name === "CmsReadError" ? 503 : ((e as { status?: number }).status ?? 500) }
    ),
}));

const put = async (body: string | object) => {
  const { PUT } = await import("../route");
  return PUT(
    new Request("http://localhost/api/cms/marketplace/currencies", {
      method: "PUT",
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );
};

describe("PUT /api/cms/marketplace/currencies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    guard = { user: { id: "u1" } };
    readMarketplaceCurrenciesStrict.mockResolvedValue(current);
    readProductPricesStrict.mockResolvedValue([]);
    readMapLocationsStrict.mockResolvedValue({ locations: [] });
  });

  it("rejects removing a currency that a trashed product still prices", async () => {
    readProductPricesStrict.mockResolvedValue([{ id: "trash", sku: "T", prices: { BRL: 12 } }]);
    const res = await put({
      countries: [{ ...country("BR"), currencies: ["USD"] }, { ...country("US"), currencies: ["USD"] }],
      currencies: ["USD"],
    });
    expect(res.status).toBe(400);
    expect(saveMarketplaceCurrencies).not.toHaveBeenCalled();
  });

  it("keeps the previous primary office when the map cannot be read", async () => {
    readMapLocationsStrict.mockRejectedValue(new Error("map down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const withOffice = { ...country("BR"), primaryOfficeId: "office-1" };
    readMarketplaceCurrenciesStrict.mockResolvedValue({ countries: [withOffice, country("US")], currencies: ["USD", "BRL"] });
    const res = await put({ countries: [withOffice, country("US")], currencies: ["USD", "BRL"] });
    expect(res.status).toBe(200);
    const saved = saveMarketplaceCurrencies.mock.calls[0][0] as { countries: Array<{ code: string; primaryOfficeId?: string }> };
    expect(saved.countries.find((c) => c.code === "BR")?.primaryOfficeId).toBe("office-1");
  });

  it("returns 503 and saves nothing when the baseline read fails", async () => {
    const error = Object.assign(new Error("x"), { name: "CmsReadError" });
    readMarketplaceCurrenciesStrict.mockRejectedValue(error);
    const res = await put({ countries: [country("US")], currencies: ["USD"] });
    expect(res.status).toBe(503);
    expect(saveMarketplaceCurrencies).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON", async () => {
    expect((await put("{nope")).status).toBe(400);
  });

  it("returns 202 and snapshots affected countries when only held changes remain", async () => {
    const res = await put({
      countries: [country("BR"), country("US", false)],
      currencies: ["USD", "BRL"],
    });
    expect(res.status).toBe(202);
    const call = submitChangeRequest.mock.calls[0] as unknown as [
      { snapshot: Array<{ code: string }>; payload: unknown },
    ];
    expect(call[0].payload).toEqual({ deactivate: ["US"], remove: [] });
    expect(call[0].snapshot.map((c) => c.code)).toEqual(["US"]);
  });

  it("keeps held countries' currencies in the saved global list", async () => {
    const res = await put({
      countries: [{ ...country("BR"), currencies: ["USD"] }],
      currencies: ["USD"],
    });
    expect(res.status).toBe(200);
    const saved = saveMarketplaceCurrencies.mock.calls[0][0] as { currencies: string[] };
    expect(saved.currencies).toEqual(expect.arrayContaining(["USD", "BRL"]));
  });
});

describe("GET /api/cms/marketplace/currencies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    guard = { user: { id: "u1" } };
  });

  const get = async (query: string) => {
    const { GET } = await import("../route");
    return GET(new Request(`http://localhost/api/cms/marketplace/currencies${query}`));
  };

  it("forEdit=1 returns 401 unauthenticated and never reads", async () => {
    guard = { response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
    expect((await get("?forEdit=1")).status).toBe(401);
    expect(readMarketplaceCurrenciesStrict).not.toHaveBeenCalled();
  });

  it("forEdit=1 returns 503 on a read error and counts only non-trash products", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { CmsReadError } = await import("@/lib/cms/server/strict-read");
    readMarketplaceCurrenciesStrict.mockRejectedValueOnce(new CmsReadError("x"));
    expect((await get("?forEdit=1")).status).toBe(503);

    readProductsStrict.mockResolvedValueOnce([
      { id: "a", enabledCountries: { US: true }, availability: {} },
      { id: "b", enabledCountries: { US: true }, availability: {}, deletedAt: "2026-01-01" },
    ]);
    const json = (await (await get("?forEdit=1")).json()) as { productCounts: Record<string, number> };
    expect(json.productCounts.US).toBe(1);
  });

  it("tolerant GET still returns data without a guard", async () => {
    guard = { response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
    const res = await get("");
    expect(res.status).toBe(200);
  });
});
