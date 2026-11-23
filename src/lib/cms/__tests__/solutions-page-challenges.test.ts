import { describe, expect, it } from "vitest";
import {
  createDefaultSolutionsPageSettings,
  normalizeSolutionsPageSettings,
} from "@/lib/cms/repositories/solutions-page-repository";

const L = (en: string) => ({ en, "pt-BR": en, es: en, "zh-CN": en });
const ens = (list: { en: string }[]) => list.map((i) => i.en);

describe("solutions page challenges", () => {
  const defaults = createDefaultSolutionsPageSettings();
  const crop = (id: string) => defaults.crops.find((c) => c.id === id)!;

  it("has defaults per crop", () => {
    expect(crop("all").challenges).toEqual([]);
    expect(crop("flowers").challenges).toHaveLength(6);
    expect(crop("vegetables").challenges[0]!.en).toBe("Production efficiency");
    expect(ens(crop("fruits").challenges)).toContain("Damage reduction");
  });

  it("uses defaults when challenges are missing", () => {
    const { challenges: _c, ...rest } = crop("fruits");
    const out = normalizeSolutionsPageSettings({ crops: [rest] });
    expect(ens(out.crops[0]!.challenges)).toEqual(ens(crop("fruits").challenges));
  });

  it("keeps an intentionally empty list", () => {
    const out = normalizeSolutionsPageSettings({
      crops: [{ ...crop("flowers"), challenges: [] }],
    });
    expect(out.crops[0]!.challenges).toEqual([]);
  });

  it("drops blanks/invalid and caps at 8", () => {
    const many = Array.from({ length: 12 }, (_, i) => L(`C${i}`));
    const out = normalizeSolutionsPageSettings({
      crops: [
        { ...crop("flowers"), challenges: [L("A"), L("  "), null, 5, ...many] },
      ],
    });
    const list = out.crops[0]!.challenges;
    expect(list).toHaveLength(8);
    expect(list[0]!.en).toBe("A");
  });
});

describe("solutions page CTA", () => {
  const defaults = createDefaultSolutionsPageSettings();

  it("has new defaults", () => {
    expect(defaults.cta.title.en).toBe("Which Solution is Right for You?");
    expect(defaults.cta.buttonLabel.en).toBe("Contact Us");
    expect(defaults.cta.href).toBe("/contact");
  });

  it("upgrades exact legacy values", () => {
    const out = normalizeSolutionsPageSettings({
      cta: {
        title: L("Ready to find the right solution?"),
        description: L(
          "Browse products in the Shop or contact our team for tailored recommendations."
        ),
        buttonLabel: L("Go to Shop"),
        href: "/shop",
      },
    });
    expect(out.cta).toEqual(defaults.cta);
  });

  it("keeps edited values", () => {
    const out = normalizeSolutionsPageSettings({
      cta: { title: L("Custom"), buttonLabel: L("Go"), href: "/x" },
    });
    expect(out.cta.title.en).toBe("Custom");
    expect(out.cta.buttonLabel.en).toBe("Go");
    expect(out.cta.href).toBe("/x");
  });
});
