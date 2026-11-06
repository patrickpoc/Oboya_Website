import { describe, expect, it } from "vitest";
import {
  computeProductPatch,
  findAffectedProducts,
  removeFromDocument,
  resolveReplacement,
  type RemovalTarget,
  type TaxonomyDoc,
} from "@/lib/cms/taxonomy-removal";
import type { CmsProduct } from "@/lib/cms/repositories/product-repository";

const doc: TaxonomyDoc = {
  categories: [
    { id: "c1", name: "C1", subcategories: [{ id: "s1", name: "S1" }, { id: "s2", name: "S2" }] },
    { id: "c2", name: "C2", subcategories: [{ id: "s3", name: "S3" }] },
  ],
  filterGroups: [{ id: "applications", name: "App" }, { id: "countriesOfOrigin", name: "Country" }],
  filterOptions: {
    applications: [{ id: "a1", name: "A1" }, { id: "a2", name: "A2" }],
    cultures: [],
    certifications: [],
    countriesOfOrigin: [{ id: "br", name: "BR" }],
  },
};

const product = (over: Partial<CmsProduct> = {}) =>
  ({
    id: "p",
    categoryId: "c1",
    subcategoryId: "s1",
    application: ["a1", "a2"],
    cultures: [],
    certifications: [],
    countryOfOrigin: "br",
    ...over,
  }) as CmsProduct;

const ok = (target: RemovalTarget, id?: string) => {
  const r = resolveReplacement(target, id, doc);
  if (!r.ok) throw new Error(r.error);
  return r;
};

describe("findAffectedProducts", () => {
  it("matches category by categoryId or by its subcategories", () => {
    const products = [product(), product({ categoryId: "c2", subcategoryId: "s2" }), product({ categoryId: "c2", subcategoryId: "s3" })];
    expect(findAffectedProducts({ kind: "category", id: "c1" }, products, doc)).toHaveLength(2);
  });
  it("matches options and groups", () => {
    const products = [product(), product({ application: [] })];
    expect(findAffectedProducts({ kind: "option", id: "a1", groupId: "applications" }, products, doc)).toHaveLength(1);
    expect(findAffectedProducts({ kind: "group", id: "applications" }, products, doc)).toHaveLength(1);
  });
});

describe("legacy brand targets", () => {
  it("is no longer a removal target", async () => {
    const { isRemovalTarget } = await import("@/lib/cms/taxonomy-removal");
    expect(isRemovalTarget({ kind: "brand", id: "b1" })).toBe(false);
    expect(isRemovalTarget({ kind: "category", id: "c1" })).toBe(true);
  });
});

describe("resolveReplacement", () => {
  it("requires a replacement for required references", () => {
    expect(resolveReplacement({ kind: "category", id: "c1" }, "", doc).ok).toBe(false);
    expect(resolveReplacement({ kind: "subcategory", id: "s1" }, undefined, doc).ok).toBe(false);
  });
  it("rejects same, unknown and in-category destinations", () => {
    expect(resolveReplacement({ kind: "subcategory", id: "s1" }, "zz", doc).ok).toBe(false);
    expect(resolveReplacement({ kind: "subcategory", id: "s1" }, "s1", doc).ok).toBe(false);
    expect(resolveReplacement({ kind: "category", id: "c1" }, "s2", doc).ok).toBe(false);
  });
  it("derives the category from the destination subcategory", () => {
    expect(ok({ kind: "subcategory", id: "s1" }, "s3")).toMatchObject({ subcategoryId: "s3", categoryId: "c2" });
  });
  it("needs nothing for optional filters", () => {
    expect(resolveReplacement({ kind: "group", id: "applications" }, undefined, doc).ok).toBe(true);
  });
});

describe("computeProductPatch", () => {
  it("moves subcategory and category together", () => {
    expect(computeProductPatch({ kind: "subcategory", id: "s1" }, product(), ok({ kind: "subcategory", id: "s1" }, "s3"))).toEqual({
      subcategoryId: "s3",
      categoryId: "c2",
    });
  });
  it("removes an option keeping the others", () => {
    const t: RemovalTarget = { kind: "option", id: "a1", groupId: "applications" };
    expect(computeProductPatch(t, product(), ok(t))).toEqual({ application: ["a2"] });
  });
  it("clears country of origin", () => {
    const t: RemovalTarget = { kind: "option", id: "br", groupId: "countriesOfOrigin" };
    expect(computeProductPatch(t, product(), ok(t))).toEqual({ countryOfOrigin: "" });
  });
  it("clears a whole group", () => {
    const t: RemovalTarget = { kind: "group", id: "applications" };
    expect(computeProductPatch(t, product(), ok(t))).toEqual({ application: [] });
  });
});

describe("removeFromDocument", () => {
  it("removes only the target", () => {
    expect(removeFromDocument({ kind: "subcategory", id: "s1" }, doc).categories[0]!.subcategories.map((s) => s.id)).toEqual(["s2"]);
    expect(removeFromDocument({ kind: "category", id: "c1" }, doc).categories.map((c) => c.id)).toEqual(["c2"]);
    const g = removeFromDocument({ kind: "group", id: "applications" }, doc);
    expect(g.filterGroups.map((x) => x.id)).toEqual(["countriesOfOrigin"]);
    expect(g.filterOptions.applications).toBeUndefined();
    expect(removeFromDocument({ kind: "option", id: "a1", groupId: "applications" }, doc).filterOptions.applications!.map((o) => o.id)).toEqual(["a2"]);
  });
});
