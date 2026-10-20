import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => false }));
vi.mock("@/lib/supabase/admin", () => ({
  isServiceRoleConfigured: () => false,
  createServiceClient: vi.fn(),
}));

const readFile = vi.fn();
vi.mock("node:fs/promises", () => ({ readFile }));

describe("readPopularQuoteProductIds", () => {
  beforeEach(() => {
    vi.resetModules();
    readFile.mockReset();
  });

  it("ranks product ids from the local quote file", async () => {
    readFile.mockResolvedValue(
      JSON.stringify([
        { type: "quote", data: { items: [{ productId: "sku-a" }, { productId: "sku-b" }] } },
        { type: "quote", data: { items: [{ productId: "sku-a" }, { productId: "sku-a" }] } },
        { type: "contact", data: { items: [{ productId: "sku-c" }] } },
      ])
    );

    const { readPopularQuoteProductIds } = await import(
      "@/lib/shop/checkout/popular-products.server"
    );
    await expect(readPopularQuoteProductIds()).resolves.toEqual(["sku-a", "sku-b"]);
  });
});
