import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => true }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/cms/server/cms-document.server", () => ({
  cmsDocumentFilePath: () => "",
  readCmsDocumentSeedFile: async () => null,
}));

const doc = {
  categories: [
    { id: "c1", name: "C1", subcategories: [{ id: "s1", name: "S1" }] },
    { id: "c2", name: "C2", subcategories: [{ id: "s2", name: "S2" }] },
  ],
  filterGroups: [{ id: "applications", name: "App" }],
  filterOptions: { applications: [{ id: "a1", name: "A1" }] },
};
const prod = (id: string, over = {}) => ({
  id,
  sku: id,
  name: id,
  status: "draft",
  categoryId: "c1",
  subcategoryId: "s1",
  application: [],
  cultures: [],
  certifications: [],
  countryOfOrigin: "",
  ...over,
});

let guard: unknown = { user: { id: "u1" } };
const readProductsStrict = vi.fn();
const readMarketplaceFiltersStrict = vi.fn();
vi.mock("@/lib/cms/server/require-cms-auth", () => ({ cmsGuard: async () => guard }));
vi.mock("@/lib/cms/server/marketplace-config.server", () => ({ readMarketplaceFiltersStrict }));
vi.mock("@/lib/cms/server/products.server", () => ({ readProductsStrict }));

describe("filter usage routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    guard = { user: { id: "u1" } };
    readMarketplaceFiltersStrict.mockResolvedValue(doc);
    readProductsStrict.mockResolvedValue([]);
  });

  it("no longer reports brand usage", async () => {
    const { GET } = await import("../route");
    const json = (await (await GET()).json()) as Record<string, unknown>;
    expect(json).not.toHaveProperty("brandUsage");
    expect(json).toHaveProperty("categoryUsage");
  });

  it("counts a product linked to a category only through its subcategory", async () => {
    readProductsStrict.mockResolvedValue([prod("p1", { categoryId: "stale", subcategoryId: "s1" })]);
    const { GET } = await import("../route");
    const json = (await (await GET()).json()) as { categoryUsage: Record<string, number> };
    expect(json.categoryUsage.c1).toBe(1);
  });

  it("returns a generic error when the strict read fails", async () => {
    const { CmsReadError } = await import("@/lib/cms/server/strict-read");
    readProductsStrict.mockRejectedValue(new CmsReadError("pg secret"));
    const { GET } = await import("../route");
    const res = await GET();
    expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).not.toContain("secret");
  });

  it("lists affected products capped at 200 with the real total", async () => {
    readProductsStrict.mockResolvedValue(Array.from({ length: 250 }, (_, i) => prod(`p${i}`)));
    const { GET } = await import("../products/route");
    const res = await GET(new Request("http://x/api?kind=subcategory&id=s1"));
    const json = (await res.json()) as { total: number; products: unknown[] };
    expect(json.total).toBe(250);
    expect(json.products).toHaveLength(200);
  });

  it("rejects an invalid target and hides read errors", async () => {
    const { GET } = await import("../products/route");
    expect((await GET(new Request("http://x/api?kind=nope&id=b1"))).status).toBe(400);
    // Brands were removed: the legacy kind is no longer accepted.
    expect((await GET(new Request("http://x/api?kind=brand&id=b1"))).status).toBe(400);
    const { CmsReadError } = await import("@/lib/cms/server/strict-read");
    readProductsStrict.mockRejectedValue(new CmsReadError("pg secret"));
    const res = await GET(new Request("http://x/api?kind=subcategory&id=s1"));
    expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).not.toContain("secret");
  });
});
