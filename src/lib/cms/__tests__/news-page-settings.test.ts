import { describe, expect, it } from "vitest";
import {
  NEWS_PAGE_DEFAULT_TEXT,
  normalizeNewsPageSettings,
} from "@/lib/cms/repositories/news-page-repository";

describe("normalizeNewsPageSettings", () => {
  it("returns defaults for empty input", () => {
    const s = normalizeNewsPageSettings(undefined);
    expect(s.title).toEqual(NEWS_PAGE_DEFAULT_TEXT.title);
    expect(s.title.en).toBe("The Latest From Oboya Horticulture");
    expect(s.postsPerPage).toBe(6);
  });

  it("fills missing and blank locales with that locale default", () => {
    const s = normalizeNewsPageSettings({
      title: { en: "Custom", es: "   " },
      postsPerPage: 9,
    });
    expect(s.title.en).toBe("Custom");
    expect(s.title.es).toBe(NEWS_PAGE_DEFAULT_TEXT.title.es);
    expect(s.title["zh-CN"]).toBe(NEWS_PAGE_DEFAULT_TEXT.title["zh-CN"]);
    expect(s.intro).toEqual(NEWS_PAGE_DEFAULT_TEXT.intro);
    expect(s.postsPerPage).toBe(9);
  });

  it("legacy eyebrow/headline docs fall back to defaults and drop the old fields", () => {
    const s = normalizeNewsPageSettings({
      eyebrow: { en: "Latest News" },
      headline: { en: "Lorem ipsum" },
      postsPerPage: 4,
    });
    expect(s.subtitle).toEqual(NEWS_PAGE_DEFAULT_TEXT.subtitle);
    expect(s).not.toHaveProperty("eyebrow");
    expect(s).not.toHaveProperty("headline");
    expect(s.postsPerPage).toBe(4);
  });
});
