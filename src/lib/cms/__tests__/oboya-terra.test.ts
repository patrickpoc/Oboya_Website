import { describe, expect, it } from "vitest";
import {
  DEFAULT_OBOYA_TERRA_SETTINGS,
  normalizeOboyaTerraSettings,
  oboyaTerraShopHref,
} from "@/lib/cms/repositories/oboya-terra-repository";

describe("oboya terra defaults", () => {
  it("has 5 blocks with 4 locales and local images", () => {
    const { blocks } = DEFAULT_OBOYA_TERRA_SETTINGS;
    expect(blocks.map((b) => b.id)).toEqual([
      "propagation",
      "growing-containers",
      "decorative-retail",
      "logistics-containers",
      "specialized-growing",
    ]);
    for (const b of blocks) {
      for (const l of ["en", "pt-BR", "es", "zh-CN"] as const) {
        expect(b.title[l]).toBeTruthy();
        expect(b.description[l]).toBeTruthy();
      }
      expect(b.image.startsWith("/assets/")).toBe(true);
    }
  });

  it("normalizes undefined to defaults", () => {
    expect(normalizeOboyaTerraSettings(undefined).blocks).toHaveLength(5);
  });
});

describe("normalizeOboyaTerraSettings", () => {
  it("caps blocks, dedupes ids, fills blank locales with EN, trims shop ids", () => {
    const blocks = Array.from({ length: 15 }, () => ({
      id: "same",
      title: { en: "T", es: "  " },
      image: "https://evil.example/x.png",
      shop: { categoryId: ` ${"a".repeat(200)} `, subcategoryId: "  " },
    }));
    const out = normalizeOboyaTerraSettings({ blocks, exploreShop: { categoryId: " c1 " } });
    expect(out.blocks).toHaveLength(12);
    expect(new Set(out.blocks.map((b) => b.id)).size).toBe(12);
    expect(out.blocks[0].title.es).toBe("T");
    expect(out.blocks[0].title["zh-CN"]).toBe("T");
    expect(out.blocks[0].image).toBe("/assets/solutions/flowers/propagation.jpg");
    expect(out.blocks[0].shop.categoryId).toHaveLength(120);
    expect(out.blocks[0].shop.subcategoryId).toBeUndefined();
    expect(out.exploreShop).toEqual({ categoryId: "c1" });
  });

  it("caps title and description length and falls back to the block default image", () => {
    const out = normalizeOboyaTerraSettings({
      blocks: [
        { id: "growing-containers", title: { en: "x".repeat(300) }, description: { en: "y".repeat(2000) }, image: "javascript:x" },
      ],
    });
    expect(out.blocks[0].title.en).toHaveLength(200);
    expect(out.blocks[0].description["zh-CN"]).toHaveLength(1000);
    expect(out.blocks[0].image).toBe("/assets/solutions/vegetables/growing.jpg");
  });

  it("keeps a valid local image and an explicitly empty block list", () => {
    const out = normalizeOboyaTerraSettings({
      blocks: [{ id: "a", image: "/assets/x.jpg" }],
    });
    expect(out.blocks[0].image).toBe("/assets/x.jpg");
    expect(normalizeOboyaTerraSettings({ blocks: [] }).blocks).toEqual([]);
  });
});

describe("oboyaTerraShopHref", () => {
  it("returns /shop when empty", () => {
    expect(oboyaTerraShopHref({})).toBe("/shop");
    expect(oboyaTerraShopHref({ categoryId: " " })).toBe("/shop");
  });

  it("builds a shop deep link when a category is set", () => {
    expect(oboyaTerraShopHref({ categoryId: "cat-1" }).startsWith("/shop")).toBe(true);
  });
});
