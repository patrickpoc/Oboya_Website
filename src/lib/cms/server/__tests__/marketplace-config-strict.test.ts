import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let configured = true;
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => configured }));
const updateShopCatalog = vi.fn();
vi.mock("@/lib/shop/catalog", () => ({ updateShopCatalog }));

const readCmsDocumentStrict = vi.fn();
vi.mock("@/lib/cms/server/strict-read", async () => {
  class CmsReadError extends Error {}
  return { CmsReadError, readCmsDocumentStrict };
});
const writeCmsDocumentData = vi.fn();
vi.mock("@/lib/cms/server/cms-document.server", () => ({
  readCmsDocumentData: vi.fn(),
  writeCmsDocumentData,
}));
const invalidateProducts = vi.fn();
vi.mock("@/lib/cms/server/cache-invalidation.server", () => ({ invalidateProducts }));
vi.mock("@/lib/cms/server/perf-log.server", () => ({ logCmsPerf: vi.fn() }));
vi.mock("@/lib/cms/server/local-fs.server", () => ({ writeLocalJsonFile: vi.fn() }));

const readProductPricesStrict = vi.fn();
const updateProductPrices = vi.fn();
const saveProduct = vi.fn();
vi.mock("@/lib/cms/server/products.server", () => ({
  readProductPricesStrict,
  updateProductPrices,
  saveProduct,
}));

const seedFiles: Record<string, unknown> = {
  "countries.json": [{ code: "US", name: "US", currencies: ["USD"], defaultCurrency: "USD" }],
  "products.json": [],
  "categories.json": [],
  "brands.json": [],
  "filter-options.json": {},
};
vi.mock("node:fs/promises", () => ({
  readFile: async (file: string) => {
    const key = Object.keys(seedFiles).find((name) => file.endsWith(name));
    if (!key) throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
    return JSON.stringify(seedFiles[key]);
  },
}));

const country = (code: string, active = true) => ({
  code,
  name: code,
  currencies: ["USD", "BRL"],
  defaultCurrency: "USD",
  active,
});
const currenciesDoc = { countries: [country("US"), country("BR", false)], currencies: ["USD", "BRL"] };

async function load() {
  return import("@/lib/cms/server/marketplace-config.server");
}

describe("strict marketplace readers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configured = true;
  });

  it("filters: absent row falls back to the seed (first save)", async () => {
    readCmsDocumentStrict.mockResolvedValue(null);
    const { readMarketplaceFiltersStrict } = await load();
    const doc = await readMarketplaceFiltersStrict();
    expect(doc.categories).toEqual([]);
  });

  it("filters: read error and malformed data throw", async () => {
    const { readMarketplaceFiltersStrict } = await load();
    readCmsDocumentStrict.mockRejectedValue(new Error("db"));
    await expect(readMarketplaceFiltersStrict()).rejects.toThrow();
    readCmsDocumentStrict.mockResolvedValue({ nope: true });
    await expect(readMarketplaceFiltersStrict()).rejects.toThrow(/malformed/);
  });

  it("currencies: absent uses seed, error and malformed throw, inactive kept on request", async () => {
    const { readMarketplaceCurrenciesStrict } = await load();
    readCmsDocumentStrict.mockResolvedValue(null);
    expect((await readMarketplaceCurrenciesStrict({ includeInactive: true })).countries.map((c) => c.code)).toEqual(["US"]);
    readCmsDocumentStrict.mockRejectedValue(new Error("db"));
    await expect(readMarketplaceCurrenciesStrict()).rejects.toThrow();
    readCmsDocumentStrict.mockResolvedValue({ countries: "x" });
    await expect(readMarketplaceCurrenciesStrict()).rejects.toThrow(/malformed/);
    readCmsDocumentStrict.mockResolvedValue(currenciesDoc);
    expect((await readMarketplaceCurrenciesStrict()).countries.map((c) => c.code)).toEqual(["US"]);
    expect((await readMarketplaceCurrenciesStrict({ includeInactive: true })).countries).toHaveLength(2);
  });
});

describe("saveMarketplaceCurrencies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configured = true;
    updateProductPrices.mockImplementation(async (updates: Array<{ id: string }>) => ({
      updated: updates.map((u) => u.id),
      failed: [],
    }));
  });

  it("updates only prices (trash included) and never calls saveProduct", async () => {
    readProductPricesStrict.mockResolvedValue([
      { id: "a", sku: "SA", prices: { USD: 5, BRL: 0 } },
      { id: "trash", sku: "ST", prices: { USD: 1 } },
      { id: "same", sku: "SS", prices: { USD: 1, BRL: 0 } },
    ]);
    const { saveMarketplaceCurrencies } = await load();
    const res = await saveMarketplaceCurrencies({ countries: [country("US")], currencies: ["USD"] });
    expect(updateProductPrices).toHaveBeenCalledWith([
      { id: "a", prices: { USD: 5 } },
      { id: "same", prices: { USD: 1 } },
    ]);
    expect(saveProduct).not.toHaveBeenCalled();
    expect(invalidateProducts).toHaveBeenCalledWith(["a", "SA", "same", "SS"]);
    expect(res).toEqual({ countries: [country("US")], productsTouched: 2 });
    expect(updateProductPrices.mock.invocationCallOrder[0]).toBeLessThan(
      writeCmsDocumentData.mock.invocationCallOrder[0]
    );
  });

  it("adds missing currencies to trashed products too", async () => {
    readProductPricesStrict.mockResolvedValue([{ id: "trash", sku: "ST", prices: { USD: 1 } }]);
    const { saveMarketplaceCurrencies } = await load();
    await saveMarketplaceCurrencies({ countries: [country("US")], currencies: ["USD", "EUR"] });
    expect(updateProductPrices).toHaveBeenCalledWith([{ id: "trash", prices: { USD: 1, EUR: 0 } }]);
  });

  it("writes nothing when the product read fails", async () => {
    readProductPricesStrict.mockRejectedValue(new Error("db"));
    const { saveMarketplaceCurrencies } = await load();
    await expect(
      saveMarketplaceCurrencies({ countries: [country("US")], currencies: ["USD"] })
    ).rejects.toThrow();
    expect(writeCmsDocumentData).not.toHaveBeenCalled();
    expect(updateProductPrices).not.toHaveBeenCalled();
  });

  it("keeps a stale non-zero price key instead of throwing", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    readProductPricesStrict.mockResolvedValue([
      { id: "trash", sku: "ST", prices: { USD: 1, BRL: 4 }, purgeAt: "2026-12-01" },
    ]);
    const { saveMarketplaceCurrencies } = await load();
    await saveMarketplaceCurrencies({ countries: [country("US")], currencies: ["USD"] });
    expect(updateProductPrices).toHaveBeenCalledWith([]);
    expect(writeCmsDocumentData).toHaveBeenCalled();
    expect(updateShopCatalog).toHaveBeenCalled();
  });

  it("allows removing a code that is absent from the document when prices are zero", async () => {
    readProductPricesStrict.mockResolvedValue([{ id: "a", sku: "SA", prices: { USD: 1, XXX: 0 } }]);
    const { saveMarketplaceCurrencies } = await load();
    await saveMarketplaceCurrencies({ countries: [country("US")], currencies: ["USD"] });
    expect(updateProductPrices).toHaveBeenCalledWith([{ id: "a", prices: { USD: 1 } }]);
  });

  it("leaves the document unwritten when some price rows failed", async () => {
    readProductPricesStrict.mockResolvedValue([{ id: "a", sku: "SA", prices: { USD: 1, BRL: 0 } }]);
    updateProductPrices.mockResolvedValue({ updated: [], failed: [{ id: "a", error: "x" }] });
    const { saveMarketplaceCurrencies } = await load();
    await expect(
      saveMarketplaceCurrencies({ countries: [country("US")], currencies: ["USD"] })
    ).rejects.toThrow(/Save again/);
    expect(writeCmsDocumentData).not.toHaveBeenCalled();
    expect(updateShopCatalog).not.toHaveBeenCalled();
  });
});

describe("shop config", () => {
  const shop = { market: { defaultCountryCode: "BR", defaultCurrencyCode: "USD" } };
  beforeEach(() => {
    vi.clearAllMocks();
    configured = true;
  });

  it("keeps a default market for an inactive country on load and save", async () => {
    readCmsDocumentStrict.mockImplementation(async (id: string) =>
      id === "marketplace-currencies" ? currenciesDoc : shop
    );
    const { readMarketplaceShopConfigStrict, saveMarketplaceShopConfig } = await load();
    expect((await readMarketplaceShopConfigStrict()).market.defaultCountryCode).toBe("BR");
    const saved = await saveMarketplaceShopConfig(shop);
    expect(saved.market.defaultCountryCode).toBe("BR");
    expect(writeCmsDocumentData).toHaveBeenCalled();
  });

  it("rejects a malformed (array) shop config document", async () => {
    readCmsDocumentStrict.mockResolvedValue([]);
    const { readMarketplaceShopConfigStrict } = await load();
    await expect(readMarketplaceShopConfigStrict()).rejects.toThrow();
  });

  it("does not clear the default when the country list is unreadable", async () => {
    const { CmsReadError } = await import("@/lib/cms/server/strict-read");
    readCmsDocumentStrict.mockImplementation(async (id: string) => {
      if (id === "marketplace-currencies") throw new CmsReadError();
      return shop;
    });
    const { readMarketplaceShopConfigStrict, saveMarketplaceShopConfig } = await load();
    expect((await readMarketplaceShopConfigStrict()).market.defaultCountryCode).toBe("BR");
    expect((await saveMarketplaceShopConfig(shop)).market.defaultCountryCode).toBe("BR");
  });
});
