import { beforeEach, describe, expect, it, vi } from "vitest";

// Real route handlers, product-writes, bulk-approval and variant guard; only the database
// edge, auth and the approval store are replaced.
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => true }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

const readProductByIdStrict = vi.fn();
const readProductsStrict = vi.fn();
const saveProduct = vi.fn();
vi.mock("@/lib/cms/server/products.server", () => ({
  readProductByIdStrict,
  readProductsStrict,
  readProductById: vi.fn(),
  findExistingProduct: vi.fn(async () => null),
  persistProductsToFileSafe: vi.fn(),
  hardDeleteProduct: vi.fn(),
  softDeleteProduct: vi.fn(),
  restoreProduct: vi.fn(),
  saveProduct,
}));
vi.mock("@/lib/cms/repositories/product-repository", () => ({
  getCmsProducts: () => [],
  hardDeleteCmsProduct: vi.fn(),
  restoreCmsProduct: vi.fn(),
  saveCmsProduct: (product: unknown) => product,
  softDeleteCmsProduct: vi.fn(),
}));
vi.mock("@/lib/cms/server/product-content.server", () => ({
  persistProductWithContent: async (p: unknown) => p,
  reconcileProductImages: vi.fn(),
}));
vi.mock("@/lib/cms/server/cache-invalidation.server", () => ({
  invalidateCatalog: vi.fn(),
  invalidateProducts: vi.fn(),
}));
vi.mock("@/lib/cms/server/require-cms-auth", () => ({
  cmsGuard: async () => ({ user: { id: "u1", name: "U" } }),
  requireCmsAuth: async () => ({ ok: true }),
}));
vi.mock("@/lib/cms/server/perf-log.server", () => ({ logCmsPerf: vi.fn() }));

let approvalRequired = false;
const submitChangeRequest = vi.fn(async (input: unknown) => ({ id: "cr1", input }));
const submitOrApply = vi.fn(async (input: { apply: () => Promise<unknown> }) =>
  approvalRequired
    ? { applied: false as const, request: { id: "cr1" } }
    : { applied: true as const, result: await input.apply() }
);
vi.mock("@/lib/cms/server/approvals.server", () => ({
  requiresApprovalFor: async () => approvalRequired,
  submitChangeRequest,
  submitOrApply,
  stripApprovalMeta: (p: unknown) => p,
  toPendingInfo: (r: unknown) => r,
  pendingApprovalResponse: (r: unknown) => Response.json({ pending: r }, { status: 202 }),
  approvalErrorResponse: (e: unknown) =>
    Response.json({ error: e instanceof Error ? e.message : "x" }, { status: 500 }),
}));

const loc = (en = "") => ({ en, "pt-BR": "", es: "", "zh-CN": "" });
const variant = (id: string, sku: string, over = {}) => ({
  id,
  sku,
  name: id,
  nameI18n: { en: id, "pt-BR": "", es: "", "zh-CN": "" },
  color: "#ff0000",
  image: "/a.jpg",
  prices: {},
  sortOrder: 0,
  moq: 1,
  ...over,
});
const stored = (over = {}) =>
  ({
    id: "P1",
    sku: "P1",
    moq: 1,
    categoryId: "c",
    subcategoryId: "s",
    images: ["/p.jpg"],
    imageColorIds: [[]],
    prices: { USD: 1 },
    defaultColor: "#000000",
    defaultColorName: loc("Black"),
    colorVariants: [variant("red", "P1-RED"), variant("blue", "P1-BLUE", { name: "blue", sortOrder: 1 })],
    name: loc("Pot"),
    shortDescription: loc(),
    description: { en: "<p>Stored long description</p>", "pt-BR": "", es: "", "zh-CN": "" },
    status: "draft",
    deletedAt: null,
    purgeAt: null,
    ...over,
  }) as Record<string, unknown>;

/** A list-loaded row: the long description is blank/absent. */
const listRow = (base: Record<string, unknown>, over = {}) => {
  const { description: _omit, ...rest } = base;
  return { ...rest, ...over };
};

const put = async (id: string, body: unknown) => {
  const { PUT } = await import("../[id]/route");
  return PUT(
    new Request(`http://x/api/cms/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    { params: Promise.resolve({ id }) }
  );
};
const bulk = async (products: unknown[]) => {
  const { POST } = await import("../bulk/route");
  return POST(
    new Request("http://x/api/cms/products/bulk", { method: "POST", body: JSON.stringify({ mode: "update", products }) })
  );
};
const bulkSubmit = async (products: unknown[]) => {
  const { POST } = await import("../bulk-submit/route");
  return POST(new Request("http://x/api/cms/products/bulk-submit", { method: "POST", body: JSON.stringify({ products }) }));
};

const post = async (body: unknown) => {
  const { POST } = await import("../route");
  return POST(new Request("http://x/api/cms/products", { method: "POST", body: JSON.stringify(body) }));
};
const bulkCreate = async (products: unknown[]) => {
  const { POST } = await import("../bulk/route");
  return POST(
    new Request("http://x/api/cms/products/bulk", { method: "POST", body: JSON.stringify({ mode: "create", products }) })
  );
};

const withVariants = (v: unknown[], base = stored()) => ({ ...base, colorVariants: v });

describe("variant changes are validated on the server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    approvalRequired = false;
    readProductByIdStrict.mockResolvedValue(stored());
    readProductsStrict.mockResolvedValue([
      stored(),
      stored({ id: "P2", sku: "P2", deletedAt: "2026-01-01", colorVariants: [variant("x", "TAKEN")] }),
    ]);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  const invalid = () => withVariants([variant("red", "P1-RED", { color: "oops" }), variant("blue", "P1-BLUE")]);
  const colliding = () => withVariants([variant("red", "taken"), variant("blue", "P1-BLUE")]);
  const unsafeImage = () => withVariants([variant("red", "P1-RED", { image: "javascript:alert(1)" }), variant("blue", "P1-BLUE")]);

  it.each([
    ["invalid hex", invalid],
    ["SKU owned by a trashed product", colliding],
    ["unsafe image URL", unsafeImage],
  ])("PUT rejects %s with 400 and writes nothing", async (_n, make) => {
    const res = await put("P1", listRow(make()));
    expect(res.status).toBe(400);
    expect(((await res.json()) as { field: string }).field).toBe("colorVariants");
    expect(saveProduct).not.toHaveBeenCalled();
    expect(submitOrApply).not.toHaveBeenCalled();
  });

  it.each([
    ["invalid hex", invalid],
    ["SKU owned by a trashed product", colliding],
    ["unsafe image URL", unsafeImage],
  ])("create (POST) rejects %s with 400 even when approval is required", async (_n, make) => {
    approvalRequired = true;
    const res = await post(listRow(make(), { id: "N1", sku: "N1" }));
    expect(res.status).toBe(400);
    expect(submitOrApply).not.toHaveBeenCalled();
    expect(saveProduct).not.toHaveBeenCalled();
  });

  it("bulk create rejects the batch with 400 before holding or writing anything", async () => {
    const bad = listRow(colliding(), { id: "N2", sku: "N2" });
    expect((await bulkCreate([bad])).status).toBe(400);
    approvalRequired = true;
    expect((await bulkCreate([bad])).status).toBe(400);
    expect(submitChangeRequest).not.toHaveBeenCalled();
    expect(saveProduct).not.toHaveBeenCalled();
  });

  it.each([
    ["colorVariants is not an array", { colorVariants: "nope" }],
    ["a variant sku is not a string", { colorVariants: [variant("red", 5 as unknown as string)] }],
    ["a variant image is not a string", { colorVariants: [variant("red", "P1-RED", { image: { u: 1 } })] }],
    ["a variant entry is null", { colorVariants: [null] }],
  ])("rejects malformed shape (%s) with 400 on PUT and create", async (_n, over) => {
    expect((await put("P1", listRow(stored(), over))).status).toBe(400);
    expect((await post(listRow(stored({ id: "N3", sku: "N3" }), over))).status).toBe(400);
    expect(saveProduct).not.toHaveBeenCalled();
  });

  it("bulk update rejects the whole batch with 400 before the first write", async () => {
    const res = await bulk([listRow(stored({ id: "P9", sku: "P9" }), { moq: 3 }), listRow(colliding())]);
    expect(res.status).toBe(400);
    expect(saveProduct).not.toHaveBeenCalled();
  });

  it("bulk update rejects the same SKU claimed by two products of the batch", async () => {
    readProductByIdStrict.mockImplementation(async (id: string) => stored({ id, sku: id }));
    const a = listRow(stored({ id: "A", sku: "A" }), { colorVariants: [variant("red", "SHARED")] });
    const b = listRow(stored({ id: "B", sku: "B" }), { colorVariants: [variant("red", "shared")] });
    const res = await bulk([a, b]);
    expect(res.status).toBe(400);
    expect(saveProduct).not.toHaveBeenCalled();
  });

  it("bulk-submit returns 400 and holds nothing", async () => {
    approvalRequired = true;
    const res = await bulkSubmit([listRow(colliding())]);
    expect(res.status).toBe(400);
    expect(submitChangeRequest).not.toHaveBeenCalled();
  });

  it("a valid variant change is saved by PUT and never touches the stored description", async () => {
    const next = withVariants([variant("red", "P1-RED-2", { nameI18n: { en: "Scarlet", "pt-BR": "", es: "", "zh-CN": "" } }), variant("blue", "P1-BLUE")]);
    const res = await put("P1", listRow(next));
    expect(res.status).toBe(200);
    const saved = saveProduct.mock.calls[0]![0] as { description: unknown; colorVariants: Array<{ sku: string; id: string }> };
    expect(saved.description).toEqual(stored().description);
    expect(saved.colorVariants[0]).toMatchObject({ id: "red", sku: "P1-RED-2" });
  });

  it("a valid bulk update keeps the stored description", async () => {
    const next = withVariants([variant("red", "P1-RED-2"), variant("blue", "P1-BLUE")]);
    const res = await bulk([listRow(next)]);
    expect(res.status).toBe(200);
    expect(saveProduct).toHaveBeenCalledTimes(1);
    expect((saveProduct.mock.calls[0]![0] as { description: unknown }).description).toEqual(stored().description);
  });

  it("the approval path keeps the stored description and diffs colorVariants by id", async () => {
    approvalRequired = true;
    const next = withVariants([variant("red", "P1-RED-2"), variant("blue", "P1-BLUE")]);
    const res = await bulkSubmit([listRow(next)]);
    expect(res.status).toBe(202);
    const held = submitChangeRequest.mock.calls[0]![0] as {
      payload: { products: Array<{ description: unknown }> };
      diff: { items: Array<{ changes: Array<{ path: string }> }> };
    };
    expect(held.payload.products[0]!.description).toEqual(stored().description);
    const paths = held.diff.items[0]!.changes.map((c) => c.path);
    expect(paths.some((p) => p.includes("colorVariants") && p.includes("red") && p.endsWith("sku"))).toBe(true);
    expect(paths.some((p) => p.includes("description"))).toBe(false);

    // And the single-product approval path.
    submitChangeRequest.mockClear();
    await put("P1", listRow(next));
    const edit = submitOrApply.mock.calls.at(-1)![0] as unknown as { payload: { product: { description: unknown } } };
    expect(edit.payload.product.description).toEqual(stored().description);
  });

  it("a save that does not change colorVariants succeeds on a legacy invalid product", async () => {
    const legacy = stored({ defaultColor: "", colorVariants: [variant("red", "", { image: "" })] });
    readProductByIdStrict.mockResolvedValue(legacy);
    const res = await put("P1", listRow(legacy, { moq: 5 }));
    expect(res.status).toBe(200);
    expect(saveProduct).toHaveBeenCalledTimes(1);
    // Neither PUT nor bulk needed to read the whole catalog for it.
    expect(readProductsStrict).not.toHaveBeenCalled();
    expect((await bulk([listRow(legacy, { moq: 6 })])).status).toBe(200);
  });
});
