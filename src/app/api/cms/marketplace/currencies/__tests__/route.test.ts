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

vi.mock("@/lib/cms/server/require-cms-auth", () => ({
  cmsGuard: async () => ({ user: { id: "u1" } }),
}));
vi.mock("@/lib/cms/server/marketplace-config.server", () => ({
  readMarketplaceCurrencies: async () => current,
  saveMarketplaceCurrencies,
}));
vi.mock("@/lib/cms/server/products.server", () => ({ readProducts: async () => [] }));
vi.mock("@/lib/map-locations.server", () => ({
  readMapLocations: async () => ({ locations: [] }),
}));
vi.mock("@/lib/cms/server/perf-log.server", () => ({ logCmsPerf: vi.fn() }));
vi.mock("@/lib/cms/server/approvals.server", () => ({
  requiresApprovalFor,
  submitChangeRequest,
  toPendingInfo: (r: unknown) => r,
  approvalErrorResponse: (e: unknown) =>
    Response.json({ error: String(e) }, { status: (e as { status?: number }).status ?? 500 }),
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
  beforeEach(() => vi.clearAllMocks());

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
