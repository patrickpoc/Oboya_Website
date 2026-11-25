import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const readProducts = vi.hoisted(() => vi.fn());
vi.mock("@/lib/cms/server/products.server", () => ({ readProducts }));
vi.mock("@/lib/cms/server/marketplace-config.server", () => ({
  readMarketplaceFilters: async () => ({}),
  readMarketplaceCurrencies: async () => ({}),
  readMarketplaceShopConfig: async () => ({}),
}));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => true }));

describe("GET /api/shop/catalog", () => {
  it("throws on read failure so the cached response is kept", async () => {
    readProducts.mockRejectedValueOnce(new Error("boom"));
    const { GET } = await import("../route");
    await expect(GET()).rejects.toThrow("boom");
  });
});
