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
vi.mock("@/lib/cms/server/marketplace-config.server", () => ({
  readMarketplaceShopConfig: readTolerant,
  readMarketplaceShopConfigStrict: readStrict,
  saveMarketplaceShopConfig: vi.fn(),
}));

const get = async (query = "") => {
  const { GET } = await import("../route");
  return GET(new Request(`http://x/api/cms/marketplace/shop-config${query}`));
};

describe("GET shop-config forEdit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    guard = { user: { id: "u1" } };
    readStrict.mockResolvedValue({ strict: true });
    readTolerant.mockResolvedValue({ tolerant: true });
  });

  it("guards before the strict read", async () => {
    guard = { response: Response.json({ error: "Forbidden" }, { status: 403 }) };
    expect((await get("?forEdit=1")).status).toBe(403);
    expect(readStrict).not.toHaveBeenCalled();
    expect(readTolerant).not.toHaveBeenCalled();
  });

  it("returns 503 on a strict read error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { CmsReadError } = await import("@/lib/cms/server/strict-read");
    readStrict.mockRejectedValue(new CmsReadError("db"));
    expect((await get("?forEdit=1")).status).toBe(503);
  });

  it("the tolerant GET still works without auth", async () => {
    guard = { response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
    const res = await get();
    expect(await res.json()).toEqual({ tolerant: true });
  });
});
