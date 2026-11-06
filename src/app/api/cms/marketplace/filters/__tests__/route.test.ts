import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => true }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/cms/server/cms-document.server", () => ({
  cmsDocumentFilePath: () => "",
  readCmsDocumentSeedFile: async () => null,
}));

let guard: unknown = { user: { id: "u1" } };
vi.mock("@/lib/cms/server/require-cms-auth", () => ({ cmsGuard: async () => guard }));
const readStrict = vi.fn();
const readTolerant = vi.fn();
const save = vi.fn();
vi.mock("@/lib/cms/server/marketplace-config.server", () => ({
  readMarketplaceFilters: readTolerant,
  readMarketplaceFiltersStrict: readStrict,
  saveMarketplaceFilters: save,
}));
const readProductsStrict = vi.fn();
vi.mock("@/lib/cms/server/products.server", () => ({ readProductsStrict }));

const get = async (query = "") => {
  const { GET } = await import("../route");
  return GET(new Request(`http://x/api/cms/marketplace/filters${query}`));
};

describe("filters route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    guard = { user: { id: "u1" } };
    readStrict.mockResolvedValue({ strict: true });
    readTolerant.mockResolvedValue({ tolerant: true });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("forEdit=1 is guarded before the strict read", async () => {
    guard = { response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
    expect((await get("?forEdit=1")).status).toBe(401);
    expect(readStrict).not.toHaveBeenCalled();
  });

  it("forEdit=1 returns 503 on a read error; tolerant GET still returns data", async () => {
    const { CmsReadError } = await import("@/lib/cms/server/strict-read");
    readStrict.mockRejectedValue(new CmsReadError("db"));
    expect((await get("?forEdit=1")).status).toBe(503);
    expect(await (await get()).json()).toEqual({ tolerant: true });
  });

  it("PUT returns 503 and saves nothing when the baseline read fails", async () => {
    const { CmsReadError } = await import("@/lib/cms/server/strict-read");
    readStrict.mockRejectedValue(new CmsReadError("db"));
    readProductsStrict.mockResolvedValue([]);
    const { PUT } = await import("../route");
    const res = await PUT(
      new Request("http://x/api/cms/marketplace/filters", {
        method: "PUT",
        body: JSON.stringify({ categories: [], filterOptions: {} }),
      })
    );
    expect(res.status).toBe(503);
    expect(save).not.toHaveBeenCalled();
  });

  it("PUT succeeds without brands and ignores brands sent by a stale tab", async () => {
    const current = { categories: [], filterGroups: [], filterOptions: {} };
    readStrict.mockResolvedValue(current);
    readProductsStrict.mockResolvedValue([]);
    save.mockImplementation(async (payload: unknown) => payload);
    const { PUT } = await import("../route");
    const put = (body: unknown) =>
      PUT(new Request("http://x/api/cms/marketplace/filters", { method: "PUT", body: JSON.stringify(body) }));

    expect((await put({ categories: [], filterOptions: {} })).status).toBe(200);
    expect((await put({ categories: [], filterOptions: {}, brands: [{ id: "b1", name: "" }, { id: "b2", name: "" }] })).status).toBe(200);
    for (const [payload] of save.mock.calls) {
      expect(payload).not.toHaveProperty("brands");
    }
  });
});
