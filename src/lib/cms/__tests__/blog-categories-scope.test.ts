import { describe, expect, it } from "vitest";
import {
  categoriesForScope,
  getBlogCategories,
  replaceBlogCategoriesCache,
  upgradeBlogCategories,
  type BlogCategory,
} from "@/lib/cms/repositories/blog-categories-repository";
import { getBlogPosts, normalizeBlogPost } from "@/lib/cms/repositories/blog-repository";

const loc = (en: string) => ({ en, "pt-BR": en, es: en, "zh-CN": en });
const old = (id: string) => ({ id, slug: id, name: loc(id) }) as unknown as BlogCategory;

describe("blog categories scope", () => {
  it("replaces the legacy defaults", () => {
    const out = upgradeBlogCategories(["general", "events"].map(old));
    expect(categoriesForScope(out, "blog")).toHaveLength(6);
    expect(categoriesForScope(out, "news")).toHaveLength(7);
    expect(out.some((c) => c.id === "general")).toBe(false);
  });

  it("pre-scope list with custom ids: scope blog, missing defaults appended once", () => {
    const out = upgradeBlogCategories([old("events"), old("custom")]);
    expect(out.find((c) => c.id === "custom")?.scope).toBe("blog");
    expect(out.filter((c) => c.id === "company-news")).toHaveLength(1);
  });

  it("scoped list is respected as-is: a deleted default stays deleted", () => {
    const saved = upgradeBlogCategories([old("events"), old("custom")]).filter(
      (c) => c.id !== "company-news"
    );
    const out = upgradeBlogCategories(saved);
    expect(out.map((c) => c.id)).toEqual(saved.map((c) => c.id));
  });

  it("categoriesForScope keeps order; cache upgrades on replace", () => {
    replaceBlogCategoriesCache([old("market")]);
    const ids = categoriesForScope(getBlogCategories(), "news").map((c) => c.id);
    expect(ids[0]).toBe("company-news");
    expect(ids.at(-1)).toBe("innovation-updates");
  });

  it("seed posts use current blog category ids; legacy ids are remapped", () => {
    const blogIds = new Set(
      categoriesForScope(upgradeBlogCategories([]), "blog").map((c) => c.id)
    );
    for (const p of getBlogPosts()) expect(blogIds.has(p.categoryId)).toBe(true);
    const post = { ...getBlogPosts()[0], categoryId: "events" };
    expect(normalizeBlogPost(post).categoryId).toBe("trade-fairs-events");
  });
});
