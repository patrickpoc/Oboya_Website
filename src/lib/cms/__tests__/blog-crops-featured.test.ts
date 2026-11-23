import { describe, expect, it } from "vitest";
import {
  getBlogPosts,
  normalizeBlogPost,
  pickFeaturedPost,
  type CmsBlogPost,
} from "@/lib/cms/repositories/blog-repository";

const base = getBlogPosts()[0];
const mk = (over: Record<string, unknown>) =>
  normalizeBlogPost({ ...base, ...over } as unknown as CmsBlogPost);

describe("blog post normalization", () => {
  it("defaults missing/invalid values", () => {
    const legacy = { ...base } as Record<string, unknown>;
    delete legacy.crops;
    delete legacy.featured;
    const n = normalizeBlogPost(legacy as unknown as CmsBlogPost);
    expect(n.crops).toEqual([]);
    expect(n.featured).toBe(false);
    expect(mk({ crops: "fruits", featured: "yes" })).toMatchObject({ crops: [], featured: false });
  });
  it("drops unknown crops and dedups", () => {
    expect(mk({ crops: ["fruits", "x", "fruits", "flowers"] }).crops).toEqual(["flowers", "fruits"]);
  });
  it("seed has one featured post", () => {
    expect(getBlogPosts().filter((p) => p.featured)).toHaveLength(1);
  });
});

describe("pickFeaturedPost", () => {
  const a = mk({ id: "a", featured: false, status: "published" });
  const b = mk({ id: "b", featured: true, status: "published" });
  const c = mk({ id: "c", featured: true, status: "draft" });
  it("prefers published featured", () => {
    expect(pickFeaturedPost([a, c, b])?.id).toBe("b");
  });
  it("falls back to first post", () => {
    expect(pickFeaturedPost([a, c])?.id).toBe("a");
    expect(pickFeaturedPost([])).toBeUndefined();
  });
});
