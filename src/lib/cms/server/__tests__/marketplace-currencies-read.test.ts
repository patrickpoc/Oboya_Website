import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/cms/server/cms-document.server", () => ({
  readCmsDocumentData: async () => ({
    currencies: ["USD"],
    countries: [
      { code: "US", name: "US", currencies: ["USD"], defaultCurrency: "USD" },
      { code: "BR", name: "BR", currencies: ["USD"], defaultCurrency: "USD", active: false },
    ],
  }),
  writeCmsDocumentData: vi.fn(),
}));
vi.mock("@/lib/cms/server/cache-invalidation.server", () => ({ invalidateProducts: vi.fn() }));
vi.mock("@/lib/cms/server/products.server", () => ({ readProducts: vi.fn(), saveProduct: vi.fn() }));
vi.mock("@/lib/shop/catalog", () => ({ updateShopCatalog: vi.fn() }));

describe("readMarketplaceCurrencies", () => {
  it("hides inactive countries unless asked", async () => {
    const { readMarketplaceCurrencies } = await import(
      "@/lib/cms/server/marketplace-config.server"
    );
    const pub = await readMarketplaceCurrencies();
    expect(pub.countries.map((c) => c.code)).toEqual(["US"]);
    const admin = await readMarketplaceCurrencies({ includeInactive: true });
    expect(admin.countries.map((c) => c.code)).toEqual(["US", "BR"]);
  });
});
