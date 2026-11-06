import { afterEach, describe, expect, it, vi } from "vitest";
import { applyBulkImportsSequentially } from "../apply-sequential";
import { applyImportPatch, createImportWorkspaceRow } from "../diff";
import { createEmptyImportProduct } from "../empty-product";
import { copyExternalImages, ImageCopyError } from "../import-images";
import { compactImages, imageUrlProblem, isExternalImageUrl, withAlignedImages } from "../images";
import { buildImportWorkspaceFromRecords } from "../parse-spreadsheet";
import type { ImportCatalog } from "../types";
import { validateBulkImport } from "../validate";

const catalog: ImportCatalog = {
  categories: [{ id: "cat-1", name: "Pots", subcategories: [{ id: "sub-1", name: "Small" }] }],
  countries: [],
  filterOptions: { applications: [], cultures: [], certifications: [], countriesOfOrigin: [] },
  existingSkus: new Set(),
  existingIds: new Set(),
};
const rowFor = (cells: Record<string, string>) =>
  buildImportWorkspaceFromRecords({ records: [{ sku: "A", name_en: "N", categoryId: "cat-1", ...cells }], catalog }).rows[0]!;
const blocked = (row: ReturnType<typeof rowFor>) =>
  validateBulkImport([row], catalog).filter((i) => i.status === "blocked" && i.field === "images");

describe("image URL validation on the row", () => {
  it.each([
    "http://cdn.example.com/a.jpg",
    "javascript:alert(1)",
    "data:image/png;base64,AAAA",
    "file:///etc/passwd",
    "ftp://x/a.jpg",
    "//evil.example.com/a.jpg",
    "not a url",
    "https://user:pw@cdn.example.com/a.jpg",
    `https://cdn.example.com/${"a".repeat(2100)}.jpg`,
  ])("flags %s", (url) => {
    expect(imageUrlProblem(url)).not.toBeNull();
    expect(blocked(rowFor({ main_image: url }))).toHaveLength(1);
  });

  it.each(["https://cdn.example.com/a.jpg?x=1", "/assets/a.webp", ""])("accepts %j", (url) => {
    expect(imageUrlProblem(url)).toBeNull();
    expect(blocked(rowFor({ main_image: url }))).toHaveLength(0);
  });

  it("reports which image is wrong", () => {
    const issues = blocked(rowFor({ main_image: "https://ok.example.com/a.jpg", image_2: "http://bad.example.com/b.jpg" }));
    expect(issues[0]!.message).toMatch(/^Image 2:/);
  });

  it("a patch from the table is validated the same way", () => {
    const row = rowFor({});
    const pending = applyImportPatch(row.pending, { images: ["http://x/a.jpg"] });
    expect(blocked({ ...row, pending })).toHaveLength(1);
  });
});

describe("images and imageColorIds stay aligned", () => {
  it.each([
    [{}, 1],
    [{ main_image: "/a.jpg" }, 1],
    [{ main_image: "/a.jpg", image_3: "/c.jpg" }, 2],
    [{ main_image: "/a.jpg", image_2: "/b.jpg", image_3: "/c.jpg" }, 3],
  ])("spreadsheet %j gives %d image slot(s) with the same number of color lists", (cells, count) => {
    const product = rowFor(cells).pending;
    expect(product.images).toHaveLength(count);
    expect(product.imageColorIds).toHaveLength(count);
    expect(blocked(rowFor(cells))).toHaveLength(0);
  });

  it("a table edit keeps them aligned, drops blanks and keeps existing color lists by index", () => {
    const base = { ...createEmptyImportProduct({ id: "A" }), images: ["/a.jpg", "/b.jpg"], imageColorIds: [["x"], []] };
    const next = applyImportPatch(base, { images: ["/a.jpg", "", "/c.jpg"] });
    expect(next.images).toEqual(["/a.jpg", "/c.jpg"]);
    expect(next.imageColorIds).toEqual([["x"], []]);
    // Dropping the first picture takes its color list with it.
    const dropped = applyImportPatch(base, { images: ["", "/b.jpg"] });
    expect(dropped.images).toEqual(["/b.jpg"]);
    expect(dropped.imageColorIds).toEqual([[]]);
    const cleared = applyImportPatch(base, { images: ["", "", ""] });
    expect(cleared.images).toEqual([""]);
    expect(cleared.imageColorIds).toEqual([[]]);
  });

  it("a mismatch is a blocking error", () => {
    const row = rowFor({ main_image: "/a.jpg" });
    const bad = { ...row, pending: { ...row.pending, imageColorIds: [] } };
    expect(blocked(bad)).toHaveLength(1);
    expect(withAlignedImages(["/a.jpg"], []).imageColorIds).toHaveLength(1);
    expect(compactImages(undefined)).toEqual([""]);
  });

  it("a new workspace row stays valid", () => {
    expect(createImportWorkspaceRow(rowFor({ main_image: "/a.jpg" }).pending).changedFields).toContain("images");
  });
});

describe("isExternalImageUrl", () => {
  it("copies other sites, keeps our storage and relative paths", () => {
    expect(isExternalImageUrl("https://images.unsplash.com/a.jpg")).toBe(true);
    expect(isExternalImageUrl("http://x.example.com/a.jpg")).toBe(true);
    expect(isExternalImageUrl("https://abc.supabase.co/storage/v1/object/public/cms-media/uploads/media-1.jpg")).toBe(false);
    // A lookalike host or a path that only contains the marker is not our storage.
    expect(isExternalImageUrl("https://evil.example.com/x/object/public/cms-media/a.jpg")).toBe(true);
    expect(isExternalImageUrl("https://evil.example.com/?u=/storage/v1/object/public/cms-media/a.jpg")).toBe(true);
    expect(isExternalImageUrl("https://abc.supabase.co.evil.com/storage/v1/object/public/cms-media/a.jpg")).toBe(true);
    expect(isExternalImageUrl("/uploads/media-1.jpg")).toBe(false);
    expect(isExternalImageUrl("/assets/a.jpg")).toBe(false);
    expect(isExternalImageUrl("")).toBe(false);
  });
});

describe("copyExternalImages", () => {
  const product = (images: string[]) => ({ ...createEmptyImportProduct({ id: "A" }), images, imageColorIds: images.map(() => []) });

  it("swaps external URLs for library URLs, in order, leaving others and copying each URL once", async () => {
    const importer = vi.fn(async (url: string) => `/uploads/copy-of-${url.split("/").pop()}`);
    const cache = new Map<string, Promise<string>>();
    const out = await copyExternalImages(product(["https://a.example.com/1.jpg", "/assets/keep.jpg", "https://a.example.com/1.jpg"]), importer, cache);
    expect(out.images).toEqual(["/uploads/copy-of-1.jpg", "/assets/keep.jpg", "/uploads/copy-of-1.jpg"]);
    expect(out.imageColorIds).toHaveLength(3);
    expect(importer).toHaveBeenCalledTimes(1);
    await copyExternalImages(product(["https://a.example.com/1.jpg"]), importer, cache);
    expect(importer).toHaveBeenCalledTimes(1); // shared across rows of the batch
  });

  it("returns the same product untouched when nothing is external", async () => {
    const importer = vi.fn();
    const p = product(["/uploads/x.jpg"]);
    expect(await copyExternalImages(p, importer)).toBe(p);
    expect(importer).not.toHaveBeenCalled();
  });

  it("names the failing image and does not cache the failure", async () => {
    const importer = vi.fn(async () => {
      throw new Error("The image host is not allowed.");
    });
    const cache = new Map<string, Promise<string>>();
    const error = await copyExternalImages(product(["/ok.jpg", "https://10.0.0.1/x.jpg"]), importer, cache).catch((e) => e);
    expect(error).toBeInstanceOf(ImageCopyError);
    expect(error.message).toBe("Image 2 (https://10.0.0.1/x.jpg): The image host is not allowed.");
    expect(cache.size).toBe(0);
  });
});

describe("applyBulkImportsSequentially with image copy", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("copies images before the POST, reports a failing row as FAILED without creating it, and still imports the others", async () => {
    const posted: Array<{ sku: string; images: string[] }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: { body?: string }) => {
        if (String(url) === "/api/cms/products") {
          posted.push(JSON.parse(init!.body!));
          return new Response("{}", { status: 200 });
        }
        return new Response("{}", { status: 200 }); // revalidate
      })
    );
    const importImage = vi.fn(async (url: string) => {
      if (url.includes("private")) throw new Error("The image host is not allowed.");
      return "https://proj.supabase.co/storage/v1/object/public/cms-media/uploads/media-1.jpg";
    });
    const good = rowFor({ main_image: "https://cdn.example.com/a.jpg" });
    const bad = buildImportWorkspaceFromRecords({
      records: [{ sku: "B", name_en: "N", categoryId: "cat-1", main_image: "https://private.example.com/x.jpg" }],
      catalog,
    }).rows[0]!;
    const plain = buildImportWorkspaceFromRecords({
      records: [{ sku: "C", name_en: "N", categoryId: "cat-1", main_image: "/assets/c.jpg" }],
      catalog,
    }).rows[0]!;

    const results = await applyBulkImportsSequentially({ rows: [good, bad, plain], gapMs: 0, importImage });

    expect(results.map((r) => [r.sku, r.status])).toEqual([["A", "SUCCESS"], ["B", "FAILED"], ["C", "SUCCESS"]]);
    expect(results[1]!.error).toBe("Image 1 (https://private.example.com/x.jpg): The image host is not allowed.");
    expect(results[1]!.suggestedAction).toMatch(/not created/);
    expect(posted.map((p) => p.sku)).toEqual(["A", "C"]);
    expect(posted[0]!.images).toEqual(["https://proj.supabase.co/storage/v1/object/public/cms-media/uploads/media-1.jpg"]);
    expect(posted[1]!.images).toEqual(["/assets/c.jpg"]);
  });
});
