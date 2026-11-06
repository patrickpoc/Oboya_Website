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
  sku: id.toUpperCase(),
  categoryId: "c1",
  subcategoryId: "s1",
  application: ["a1", "keep"],
  cultures: [],
  certifications: [],
  countryOfOrigin: "",
  ...over,
});

let guard: unknown = { user: { id: "u1", name: "U" } };
const readMarketplaceFiltersStrict = vi.fn();
const readProductsStrict = vi.fn();
const updateProductReferences = vi.fn();
const saveMarketplaceFilters = vi.fn(async (d: unknown) => d);
const addAuditLogDurable = vi.fn<(entry: { details: string }) => Promise<object>>(async () => ({}));

const cmsGuard = vi.fn(async (..._args: unknown[]) => guard);
vi.mock("@/lib/cms/server/require-cms-auth", () => ({ cmsGuard }));
vi.mock("@/lib/cms/server/marketplace-config.server", () => ({
  readMarketplaceFiltersStrict,
  saveMarketplaceFilters,
}));
vi.mock("@/lib/cms/server/products.server", () => ({
  readProductsStrict,
  updateProductReferences,
}));
vi.mock("@/lib/cms/server/audit-logs.server", () => ({ addAuditLogDurable }));
const invalidateCatalog = vi.fn();
vi.mock("@/lib/cms/server/cache-invalidation.server", () => ({
  invalidateCatalog,
  invalidateProducts: vi.fn(),
}));

const post = async (body: unknown) => {
  const { POST } = await import("../route");
  return POST(
    new Request("http://localhost/api/cms/marketplace/filters/remove", {
      method: "POST",
      body: JSON.stringify(body),
    })
  );
};

describe("POST /api/cms/marketplace/filters/remove", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    guard = { user: { id: "u1", name: "U" } };
    readMarketplaceFiltersStrict.mockResolvedValue(doc);
    readProductsStrict.mockResolvedValue([prod("p1"), prod("p2", { categoryId: "c2", subcategoryId: "s2" })]);
    updateProductReferences.mockImplementation(async (u: Array<{ id: string }>) => ({
      updated: u.map((x) => x.id),
      failed: [],
    }));
  });

  it("returns the guard response without permission", async () => {
    guard = { response: Response.json({ error: "no" }, { status: 403 }) };
    expect((await post({ target: { kind: "group", id: "applications" } })).status).toBe(403);
    expect(updateProductReferences).not.toHaveBeenCalled();
  });

  it("requires both marketplace delete and edit", async () => {
    await post({ target: { kind: "group", id: "applications" } });
    expect(cmsGuard).toHaveBeenCalledWith("marketplace", "delete");
    expect(cmsGuard).toHaveBeenCalledWith("marketplace", "edit");
  });

  it("rejects a caller that can delete but not edit", async () => {
    cmsGuard.mockImplementation(async (...args: unknown[]) =>
      args[1] === "edit" ? { response: Response.json({ error: "no" }, { status: 403 }) } : guard
    );
    expect((await post({ target: { kind: "group", id: "applications" } })).status).toBe(403);
    expect(updateProductReferences).not.toHaveBeenCalled();
    expect(saveMarketplaceFilters).not.toHaveBeenCalled();
    cmsGuard.mockImplementation(async () => guard);
  });

  it("rejects invalid target and missing replacement", async () => {
    expect((await post({ target: { kind: "nope", id: "x" } })).status).toBe(400);
    const res = await post({ target: { kind: "subcategory", id: "s1" } });
    expect(res.status).toBe(400);
    expect(saveMarketplaceFilters).not.toHaveBeenCalled();
  });

  it("rejects a destination equal to the removed item", async () => {
    expect((await post({ target: { kind: "subcategory", id: "s1" }, replacementId: "s1" })).status).toBe(400);
  });

  it("moves products, saves the document and audits", async () => {
    const res = await post({ target: { kind: "subcategory", id: "s1" }, replacementId: "s2" });
    expect(res.status).toBe(200);
    expect(updateProductReferences).toHaveBeenCalledWith([
      { id: "p1", patch: { subcategoryId: "s2", categoryId: "c2" } },
    ]);
    const saved = saveMarketplaceFilters.mock.calls[0]![0] as typeof doc;
    expect(saved.categories[0]!.subcategories).toEqual([]);
    expect(addAuditLogDurable).toHaveBeenCalledTimes(2);
    const phases = addAuditLogDurable.mock.calls.map((c) => JSON.parse(c[0]!.details).phase);
    expect(phases).toEqual(["started", "outcome"]);
  });

  it("removes an option only from products that use it", async () => {
    const res = await post({ target: { kind: "option", id: "a1", groupId: "applications" } });
    expect(res.status).toBe(200);
    expect((updateProductReferences.mock.calls[0]![0] as Array<{ patch: unknown }>)[0]!.patch).toEqual({
      application: ["keep"],
    });
  });

  it("retry only touches products not yet updated", async () => {
    updateProductReferences.mockResolvedValueOnce({ updated: ["p1"], failed: [{ id: "p2", error: "boom" }] });
    readProductsStrict.mockResolvedValue([prod("p1"), prod("p2")]);
    const target = { kind: "option", id: "a1", groupId: "applications" };
    expect((await post({ target })).status).toBe(409);
    readProductsStrict.mockResolvedValue([prod("p1", { application: ["keep"] }), prod("p2")]);
    expect((await post({ target })).status).toBe(200);
    const retryIds = (updateProductReferences.mock.calls[1]![0] as Array<{ id: string }>).map((u) => u.id);
    expect(retryIds).toEqual(["p2"]);
  });

  it("reports failed products and does not save the document", async () => {
    updateProductReferences.mockResolvedValueOnce({ updated: ["p1"], failed: [{ id: "p2", error: "boom" }] });
    const res = await post({ target: { kind: "group", id: "applications" } });
    expect(res.status).toBe(409);
    expect(((await res.json()) as { failed: unknown[] }).failed).toHaveLength(1);
    expect(saveMarketplaceFilters).not.toHaveBeenCalled();
  });

  const details = (i: number) =>
    JSON.parse(addAuditLogDurable.mock.calls[i]![0].details);

  it("aborts without writing when the document read fails", async () => {
    readMarketplaceFiltersStrict.mockRejectedValue(new Error("db down: secret"));
    const res = await post({ target: { kind: "subcategory", id: "s1" }, replacementId: "s2" });
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("secret");
    expect(updateProductReferences).not.toHaveBeenCalled();
    expect(saveMarketplaceFilters).not.toHaveBeenCalled();
    expect(addAuditLogDurable).not.toHaveBeenCalled();
  });

  it("aborts before any product write when the started audit fails", async () => {
    addAuditLogDurable.mockRejectedValueOnce(new Error("audit down"));
    const res = await post({ target: { kind: "group", id: "applications" } });
    expect(res.status).toBe(500);
    expect(updateProductReferences).not.toHaveBeenCalled();
    expect(saveMarketplaceFilters).not.toHaveBeenCalled();
  });

  it("records previous values in the started audit and only canonical fields", async () => {
    await post({ target: { kind: "option", id: "a1", groupId: "applications", extra: "x" }, replacementId: undefined, junk: 1 });
    const started = details(0);
    expect(started.target).toEqual({ kind: "option", id: "a1", groupId: "applications" });
    expect(started.productIds).toEqual(["p1", "p2"]);
    expect(started.previous.p1).toEqual({ application: ["a1", "keep"] });
    expect(JSON.stringify(started)).not.toContain("junk");
  });

  it("audits a partial failure, returns only ids, and keeps the trail on retry", async () => {
    updateProductReferences.mockResolvedValueOnce({ updated: ["p1"], failed: [{ id: "p2", error: "pg secret" }] });
    const target = { kind: "group", id: "applications" };
    const res = await post({ target });
    const json = (await res.json()) as { failed: string[] };
    expect(res.status).toBe(409);
    expect(json.failed).toEqual(["p2"]);
    expect(JSON.stringify(json)).not.toContain("secret");
    expect(details(1)).toMatchObject({ phase: "outcome", status: "partial", failedIds: ["p2"] });
    expect(await post({ target })).toHaveProperty("status", 200);
    expect(details(2).phase).toBe("started");
    expect(details(3).status).toBe("completed");
    expect(details(0).previous.p2).toBeDefined();
  });

  it("audits a failed document save", async () => {
    saveMarketplaceFilters.mockRejectedValueOnce(new Error("save boom"));
    const res = await post({ target: { kind: "group", id: "applications" } });
    expect(res.status).toBe(500);
    expect(details(1).status).toBe("document_save_failed");
  });

  it("logs when the outcome audit fails but still succeeds", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    addAuditLogDurable.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("late"));
    expect((await post({ target: { kind: "group", id: "applications" } })).status).toBe(200);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("moves category products, including subcategory-only ones, to the destination", async () => {
    readProductsStrict.mockResolvedValue([prod("p1"), prod("p3", { categoryId: "other", subcategoryId: "s1" })]);
    const res = await post({ target: { kind: "category", id: "c1" }, replacementId: "s2" });
    expect(res.status).toBe(200);
    expect((updateProductReferences.mock.calls[0]![0] as Array<{ id: string }>).map((u) => u.id)).toEqual(["p1", "p3"]);
    expect((saveMarketplaceFilters.mock.calls[0]![0] as typeof doc).categories.map((c) => c.id)).toEqual(["c2"]);
  });

  it("rejects the removed brand kind", async () => {
    const res = await post({ target: { kind: "brand", id: "b1" }, replacementId: "b2" });
    expect(res.status).toBe(400);
    expect(updateProductReferences).not.toHaveBeenCalled();
    expect(saveMarketplaceFilters).not.toHaveBeenCalled();
  });

  it("clears a group on products and drops it from the document", async () => {
    expect((await post({ target: { kind: "group", id: "applications" } })).status).toBe(200);
    expect((updateProductReferences.mock.calls[0]![0] as Array<{ patch: unknown }>)[0]!.patch).toEqual({ application: [] });
    expect((saveMarketplaceFilters.mock.calls[0]![0] as typeof doc).filterGroups).toEqual([]);
  });

  it("treats an already removed, unused item as success (lost response)", async () => {
    const res = await post({ target: { kind: "group", id: "gone" } });
    expect(res.status).toBe(200);
    expect(saveMarketplaceFilters).not.toHaveBeenCalled();
  });

  it("validates shapes and prototype-key groups", async () => {
    expect((await post({ target: { kind: "subcategory", id: "s1" }, replacementId: 5 })).status).toBe(400);
    expect((await post({ target: { kind: "group", id: "x".repeat(500) } })).status).toBe(400);
    for (const groupId of ["__proto__", "constructor"]) {
      const res = await post({ target: { kind: "option", id: "a1", groupId } });
      expect(res.status).toBe(404);
    }
    expect(updateProductReferences).not.toHaveBeenCalled();
  });

  it("already removed: busts the catalog and audits the outcome", async () => {
    readProductsStrict.mockResolvedValue([prod("p1", { application: ["keep"] })]);
    const res = await post({ target: { kind: "group", id: "gone" } });
    expect(res.status).toBe(200);
    expect(invalidateCatalog).toHaveBeenCalled();
    const entries = addAuditLogDurable.mock.calls.map((c) => JSON.parse(c[0]!.details));
    expect(entries).toEqual([expect.objectContaining({ phase: "outcome", status: "already_removed" })]);
  });

  it("saves against a fresh document so a concurrent unrelated edit survives", async () => {
    const fresh = { ...doc, filterGroups: [...doc.filterGroups, { id: "added", name: "Added meanwhile" }] };
    readMarketplaceFiltersStrict.mockResolvedValueOnce(doc).mockResolvedValueOnce(fresh);
    const res = await post({ target: { kind: "subcategory", id: "s1" }, replacementId: "s2" });
    expect(res.status).toBe(200);
    const saved = saveMarketplaceFilters.mock.calls[0]![0] as typeof doc;
    expect(saved.filterGroups.map((g) => g.id)).toContain("added");
    expect(saved.categories[0]!.subcategories).toEqual([]);
  });

  it("re-read failure audits document_save_failed and returns 503 without saving", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { CmsReadError } = await import("@/lib/cms/server/strict-read");
    readMarketplaceFiltersStrict.mockResolvedValueOnce(doc).mockRejectedValueOnce(new CmsReadError("db"));
    const res = await post({ target: { kind: "subcategory", id: "s1" }, replacementId: "s2" });
    expect(res.status).toBe(503);
    expect(saveMarketplaceFilters).not.toHaveBeenCalled();
    const last = JSON.parse(addAuditLogDurable.mock.calls.at(-1)![0]!.details);
    expect(last).toMatchObject({ phase: "outcome", status: "document_save_failed" });
  });

  it("a replacement that disappeared meanwhile returns 409 and does not save", async () => {
    const fresh = {
      ...doc,
      categories: [doc.categories[0]!],
    };
    readMarketplaceFiltersStrict.mockResolvedValueOnce(doc).mockResolvedValueOnce(fresh);
    const res = await post({ target: { kind: "subcategory", id: "s1" }, replacementId: "s2" });
    expect(res.status).toBe(409);
    expect(saveMarketplaceFilters).not.toHaveBeenCalled();
  });
});
