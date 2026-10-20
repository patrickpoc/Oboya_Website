import { describe, expect, it } from "vitest";
import { pickLocalizedLabel } from "@/lib/shop/localized-label";

describe("pickLocalizedLabel", () => {
  it("falls back to English when the locale is missing", () => {
    expect(
      pickLocalizedLabel("fr", "Fallback", { en: "English", "pt-BR": "Português" })
    ).toBe("English");
  });

  it("skips an empty string and uses the next fallback", () => {
    expect(pickLocalizedLabel("pt-BR", "Name", { en: "English", "pt-BR": "  " })).toBe(
      "English"
    );
    expect(pickLocalizedLabel("pt-BR", "Name", { en: "" })).toBe("Name");
  });
});
