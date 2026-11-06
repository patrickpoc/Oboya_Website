import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const readProductByIdStrict = vi.fn();
vi.mock("@/lib/cms/server/products.server", () => ({ readProductByIdStrict }));
const writeProduct = vi.fn();
vi.mock("@/lib/cms/server/product-writes.server", () => ({
  createProductWrite: vi.fn(),
  deleteProductWrite: vi.fn(),
  mergeProductUpdate: (a: unknown) => a,
  invalidateCatalog: vi.fn(),
  syncProductsFile: vi.fn(),
  writeProduct,
}));
const readMarketplaceCurrenciesStrict = vi.fn();
const saveMarketplaceCurrencies = vi.fn();
vi.mock("@/lib/cms/server/marketplace-config.server", () => ({
  readMarketplaceCurrenciesStrict,
  saveMarketplaceCurrencies,
}));
const readAboutPageSettingsStrict = vi.fn();
vi.mock("@/lib/cms/server/about-page.server", () => ({
  readAboutPageSettingsStrict,
  saveAboutPageSettingsDurable: vi.fn(),
}));
vi.mock("@/lib/cms/revalidate-site", () => ({ revalidateAboutPages: vi.fn() }));

const req = (changeType: string, payloadProposed: unknown, snapshotBefore: unknown = null) =>
  ({ id: "r1", changeType, payloadProposed, snapshotBefore, diff: { entries: [] } }) as never;

describe("appliers fail on a baseline read error instead of treating data as missing", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { CmsReadError } = await import("@/lib/cms/server/strict-read");
    const error = new CmsReadError();
    readProductByIdStrict.mockRejectedValue(error);
    readMarketplaceCurrenciesStrict.mockRejectedValue(error);
    readAboutPageSettingsStrict.mockRejectedValue(error);
  });

  async function applier(type: string) {
    const { getApplier } = await import("@/lib/cms/server/approval-appliers.server");
    return (await getApplier(type as never))!;
  }
  const rejectsRead = async (promise: Promise<unknown>) => {
    const { CmsReadError } = await import("@/lib/cms/server/strict-read");
    await expect(promise).rejects.toBeInstanceOf(CmsReadError);
  };

  it("product_edit: detectConflicts and apply throw, nothing is written", async () => {
    const a = await applier("marketplace.product_edit");
    const r = req("marketplace.product_edit", { product: { id: "p" }, preserveCurrentPrices: false });
    await rejectsRead(a.detectConflicts(r));
    await rejectsRead(a.apply(r, { force: true }));
    expect(writeProduct).not.toHaveBeenCalled();
  });

  it("bulk_update: reads every baseline first, so nothing is written", async () => {
    const { CmsReadError } = await import("@/lib/cms/server/strict-read");
    readProductByIdStrict
      .mockReset()
      .mockResolvedValueOnce({ id: "a" })
      .mockRejectedValueOnce(new CmsReadError());
    const a = await applier("marketplace.bulk_update");
    await rejectsRead(
      a.apply(req("marketplace.bulk_update", { products: [{ id: "a" }, { id: "b" }] }), { force: true })
    );
    expect(writeProduct).not.toHaveBeenCalled();
  });

  it("marketplace.countries: throws instead of using seed countries", async () => {
    const a = await applier("marketplace.countries");
    const r = req("marketplace.countries", { deactivate: ["US"], remove: [] }, []);
    await rejectsRead(a.detectConflicts(r));
    await rejectsRead(a.apply(r, { force: true }));
    expect(saveMarketplaceCurrencies).not.toHaveBeenCalled();
  });

  it("settings document (about): detectConflicts throws", async () => {
    const a = await applier("website.about");
    await rejectsRead(a.detectConflicts(req("website.about", {}, {})));
  });
});
