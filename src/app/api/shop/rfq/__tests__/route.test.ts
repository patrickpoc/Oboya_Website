import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const addQuote = vi.fn();
const readProducts = vi.fn();
vi.mock("@/lib/cms/server/forms.server", () => ({
  addQuoteSubmissionWithReference: addQuote,
}));
vi.mock("@/lib/cms/server/products.server", () => ({ readProducts }));
const readCurrencies = vi.fn(async (opts?: { includeInactive?: boolean }) => {
  const { filterActiveCountries } = await import("@/lib/cms/marketplace-countries");
  const countries = [
    { code: "BR", name: "Brazil", currencies: ["USD"], defaultCurrency: "USD", active: true },
    { code: "AR", name: "Argentina", currencies: ["USD"], defaultCurrency: "USD", active: false },
  ];
  return {
    currencies: ["USD"],
    countries: opts?.includeInactive ? countries : filterActiveCountries(countries),
  };
});
vi.mock("@/lib/cms/server/marketplace-config.server", () => ({
  readMarketplaceShopConfig: async () => ({ rfq: { enabled: true } }),
  readMarketplaceCurrencies: (opts?: { includeInactive?: boolean }) => readCurrencies(opts),
}));
vi.mock("@/lib/map-locations.server", () => ({
  readMapLocations: async () => ({ locations: [] }),
}));
vi.mock("@/lib/security/rate-limit", () => ({ assertFormRateLimit: async () => ({ ok: true }) }));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => false }));
vi.mock("@/lib/supabase/admin", () => ({ isServiceRoleConfigured: () => false }));

function product(id: string, over: Record<string, unknown> = {}) {
  return {
    id,
    sku: id,
    status: "published",
    name: { en: id },
    images: [],
    prices: { USD: 10 },
    moq: 1,
    unlimitedStock: false,
    stockQuantity: 100,
    enabledCountries: { BR: true },
    availability: { BR: true },
    ...over,
  };
}

async function post(items: unknown[], countryCode = "BR") {
  const { POST } = await import("../route");
  return POST(
    new Request("http://localhost/api/shop/rfq", {
      method: "POST",
      body: JSON.stringify({
        company: "Acme",
        contactName: "Ana",
        email: "ana@example.com",
        phone: "123",
        countryCode,
        currency: "USD",
        privacyAccepted: true,
        items,
      }),
    })
  );
}

const saved = () =>
  addQuote.mock.calls[0][1] as {
    items: Array<Record<string, unknown>>;
    [key: string]: unknown;
  };

beforeEach(() => {
  vi.clearAllMocks();
  addQuote.mockResolvedValue({ referenceId: "OBOYA-BR-1" });
  readProducts.mockResolvedValue([
    product("stock"),
    product("quote", { saleMode: "quote", prices: {} }),
    product("nopricestock", { prices: {} }),
    product("empty", { stockQuantity: 0 }),
  ]);
});

describe("POST /api/shop/rfq sale modes", () => {
  it("stock only keeps the estimated total", async () => {
    const res = await post([{ productId: "stock", quantity: 3 }]);
    expect(res.status).toBe(200);
    expect(saved()).toMatchObject({ pricing: "estimated", pendingItemCount: 0, total: 30 });
    expect(saved().items[0]).toMatchObject({ saleMode: "stock", unitPrice: 10, lineTotal: 30 });
  });

  it("mixed sums priced lines only", async () => {
    await post([
      { productId: "stock", quantity: 2 },
      { productId: "quote", quantity: 5 },
    ]);
    expect(saved()).toMatchObject({ pricing: "mixed", pendingItemCount: 1, total: 20 });
    expect(saved().items[1]).toMatchObject({ saleMode: "quote", unitPrice: null, lineTotal: null });
  });

  it("quote only has null total", async () => {
    const res = await post([{ productId: "quote", quantity: 1 }]);
    expect(res.status).toBe(200);
    expect(saved()).toMatchObject({ pricing: "quote_only", pendingItemCount: 1, total: null });
  });

  it("rejects stock products without a price", async () => {
    const res = await post([{ productId: "nopricestock", quantity: 1 }]);
    expect(res.status).toBe(400);
    expect(addQuote).not.toHaveBeenCalled();
  });

  it("ignores client-sent price and mode", async () => {
    await post([{ productId: "quote", quantity: 1, unitPrice: 1, saleMode: "stock" }]);
    expect(saved().items[0]).toMatchObject({ saleMode: "quote", unitPrice: null });
    addQuote.mockClear();
    await post([{ productId: "stock", quantity: 1, unitPrice: 0.01 }]);
    expect(saved().items[0].unitPrice).toBe(10);
  });

  it("treats limited stock 0 as a quote line", async () => {
    const res = await post([{ productId: "empty", quantity: 1 }]);
    expect(res.status).toBe(200);
    expect(saved().items[0]).toMatchObject({ saleMode: "quote", unitPrice: null });
  });

  it("still enforces MOQ on quote lines", async () => {
    readProducts.mockResolvedValue([product("quote", { saleMode: "quote", moq: 5 })]);
    const res = await post([{ productId: "quote", quantity: 1 }]);
    expect(res.status).toBe(400);
  });

  it("rejects an inactive or unknown country", async () => {
    const res = await post([{ productId: "stock", quantity: 1 }], "XX");
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid country");
    expect(addQuote).not.toHaveBeenCalled();
  });

  it("rejects an inactive country using the active-only read", async () => {
    const res = await post([{ productId: "stock", quantity: 1 }], "AR");
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("Invalid country");
    expect(readCurrencies).toHaveBeenCalled();
    for (const call of readCurrencies.mock.calls) expect(call[0]?.includeInactive).toBeFalsy();
    expect(addQuote).not.toHaveBeenCalled();
  });

  it("rejects a stock line above the available stock", async () => {
    const res = await post([{ productId: "stock", quantity: 101 }]);
    expect(res.status).toBe(400);
    expect(addQuote).not.toHaveBeenCalled();
  });

  it("rejects a stock line with no price in the currency", async () => {
    readProducts.mockResolvedValue([product("eur", { prices: { EUR: 9 } })]);
    const res = await post([{ productId: "eur", quantity: 1 }]);
    expect(res.status).toBe(400);
    expect(addQuote).not.toHaveBeenCalled();
  });
});
