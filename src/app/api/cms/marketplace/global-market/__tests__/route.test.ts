import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
let guard: unknown = { user: { id: "u1", name: "U" } };
vi.mock("@/lib/cms/server/require-cms-auth", () => ({ cmsGuard: async () => guard }));
const readCurrencies = vi.fn();
const readShop = vi.fn();
const saveGlobal = vi.fn();
vi.mock("@/lib/cms/server/marketplace-config.server", () => ({
  readMarketplaceCurrenciesStrict: readCurrencies,
  readMarketplaceShopConfigStrict: readShop,
  saveMarketplaceGlobalCountry: saveGlobal,
}));
const audit = vi.fn();
vi.mock("@/lib/cms/server/audit-logs.server", () => ({ addAuditLogDurable: audit }));

const put = async (body: unknown) => {
  const { PUT } = await import("../route");
  return PUT(
    new Request("http://x/api/cms/marketplace/global-market", {
      method: "PUT",
      body: JSON.stringify(body),
    })
  );
};
const get = async (query = "?forEdit=1") => {
  const { GET } = await import("../route");
  return GET(new Request(`http://x/api/cms/marketplace/global-market${query}`));
};

describe("global-market route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    guard = { user: { id: "u1", name: "U" } };
    readCurrencies.mockResolvedValue({ countries: [{ code: "CN" }], currencies: [] });
    readShop.mockResolvedValue({ market: { globalCountryCode: null } });
    saveGlobal.mockImplementation(async (code: string | null) => ({
      config: { market: { globalCountryCode: code } },
      previous: "AA",
    }));
  });

  it("rejects without permission", async () => {
    guard = { response: Response.json({ error: "Forbidden" }, { status: 403 }) };
    expect((await put({ globalCountryCode: "CN" })).status).toBe(403);
    expect((await get()).status).toBe(403);
    expect(saveGlobal).not.toHaveBeenCalled();
  });

  it("GET needs forEdit", async () => {
    expect((await get("")).status).toBe(400);
  });

  it("GET returns the code and 503 on read error", async () => {
    readShop.mockResolvedValue({ market: { globalCountryCode: "CN" } });
    expect(await (await get()).json()).toEqual({ globalCountryCode: "CN" });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { CmsReadError } = await import("@/lib/cms/server/strict-read");
    readShop.mockRejectedValue(new CmsReadError("db"));
    expect((await get()).status).toBe(503);
  });

  it.each(["china", 123, "all", undefined])("rejects invalid %s", async (value) => {
    expect((await put({ globalCountryCode: value })).status).toBe(400);
    expect(saveGlobal).not.toHaveBeenCalled();
  });

  it("rejects inactive or unknown country", async () => {
    const res = await put({ globalCountryCode: "BR" });
    expect(res.status).toBe(400);
    expect(saveGlobal).not.toHaveBeenCalled();
  });

  it("saves, audits, and tolerates audit failure", async () => {
    const res = await put({ globalCountryCode: "cn" });
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("no-store");
    expect(saveGlobal).toHaveBeenCalledWith("CN");
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        module: "marketplace",
        resourceId: "global-market",
        details: JSON.stringify({ from: "AA", to: "CN" }),
      })
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    audit.mockRejectedValue(new Error("x"));
    expect((await put({ globalCountryCode: null })).status).toBe(200);
    expect(saveGlobal).toHaveBeenLastCalledWith(null);
  });

  it("503 and no write when the strict read fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { CmsReadError } = await import("@/lib/cms/server/strict-read");
    saveGlobal.mockRejectedValue(new CmsReadError("db"));
    expect((await put({ globalCountryCode: "CN" })).status).toBe(503);
  });
});
