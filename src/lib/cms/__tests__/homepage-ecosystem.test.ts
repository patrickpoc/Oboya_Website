import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  HOME_ECOSYSTEM_STAGE_IDS,
  getHomepageSettings,
  replaceHomepageSettingsCache,
  resetHomepageSettings,
  type HomepageSettings,
} from "@/lib/cms/repositories/homepage-repository";

const loc = (en: string, rest = "") => ({ en, "pt-BR": rest, es: rest, "zh-CN": rest });

function load(patch: unknown) {
  const base = resetHomepageSettings() as unknown as Record<string, unknown>;
  const doc = { ...base };
  if (patch === undefined) delete doc.homeEcosystem;
  else doc.homeEcosystem = patch;
  replaceHomepageSettingsCache(doc as unknown as HomepageSettings);
  return getHomepageSettings().homeEcosystem;
}
const stageOf = (eco: ReturnType<typeof load>, id: string) =>
  eco.stages.find((s) => s.id === id)!;

describe("homeEcosystem settings", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("fills defaults when the stored document predates homeEcosystem", () => {
    const eco = load(undefined);
    expect(eco.stages.map((s) => s.id)).toEqual([...HOME_ECOSYSTEM_STAGE_IDS]);
    expect(eco.openingLine.en).toBe("Oboya, your one-stop partner for horticulture.");
    expect(eco.closingLine2.en).toBe("Endless Opportunities to Perform Better.");
    expect(stageOf(eco, "logistics").label.en).toBe("Logistics & Transport");
    expect(eco.stages.every((s) => s.image === "")).toBe(true);
  });

  it("merges a partial document", () => {
    const eco = load({ slogan: loc("Custom", "Custom") });
    expect(eco.slogan.en).toBe("Custom");
    expect(eco.title.en).toContain("Retail Display");
    expect(eco.stages).toHaveLength(6);
  });

  it("drops pos and unknown ids, ignores duplicates and reordering", () => {
    const eco = load({
      stages: [
        { id: "pos", label: loc("POS") },
        { id: "retail", label: loc("R1") },
        { id: "nope", label: loc("X") },
        { id: "propagation", label: loc("P") },
        { id: "retail", label: loc("R2") },
      ],
    });
    expect(eco.stages.map((s) => s.id)).toEqual([...HOME_ECOSYSTEM_STAGE_IDS]);
    expect(stageOf(eco, "retail").label.en).toBe("R1");
    expect(stageOf(eco, "propagation").label.en).toBe("P");
  });

  it("falls back to the default for an empty locale", () => {
    const eco = load({ slogan: loc("", ""), stages: [{ id: "harvest", label: loc("") }] });
    expect(eco.slogan.en).toBe("Oboya, your one-stop partner for horticulture.");
    expect(stageOf(eco, "harvest").label.en).toBe("Harvest");
    expect(stageOf(eco, "harvest").label["pt-BR"]).toBe("Colheita");
  });

  it("drops legacy stage items on load and keeps default points", () => {
    const eco = load({
      stages: [
        { id: "propagation", label: loc("P"), items: [{ id: "trays", text: loc("Mine") }] },
      ],
    });
    const p = stageOf(eco, "propagation");
    expect(p.label.en).toBe("P");
    expect("items" in p).toBe(false);
    expect(eco.stages.every((s) => !("items" in s))).toBe(true);
    expect(p.points.map((pt) => pt.text.en)).toEqual([
      "Propagation trays",
      "Substrates & plugs",
      "Seeding machines",
    ]);
  });

  it("provides a default description and three points per stage", () => {
    const eco = load(undefined);
    for (const s of eco.stages) {
      expect(s.description.en.length).toBeGreaterThan(0);
      expect(s.points).toHaveLength(3);
      expect(new Set(s.points.map((p) => p.id)).size).toBe(3);
      for (const p of s.points) expect(p.text.en.length).toBeGreaterThan(0);
    }
    expect(stageOf(eco, "retail").description.en).toContain("shoppers");
  });

  it("merges stored points by id and keeps the stored order", () => {
    const eco = load({
      stages: [
        {
          id: "growing",
          points: [
            { id: "irrigation", text: loc("Drip lines") },
            { id: "pots", text: loc("") },
            { id: "custom", text: loc("Mine", "Meu") },
          ],
        },
      ],
    });
    const pts = stageOf(eco, "growing").points;
    expect(pts.map((p) => p.id)).toEqual(["irrigation", "pots", "custom"]);
    expect(pts[0].text.en).toBe("Drip lines");
    expect(pts[1].text.en).toBe("Pots & containers");
    expect(pts[2].text["pt-BR"]).toBe("Meu");
  });

  it("caps points at 3 and drops blank or malformed ones", () => {
    const eco = load({
      stages: [
        {
          id: "harvest",
          points: [
            { id: "blank", text: loc("", "") },
            { id: "a", text: loc("A") },
            { text: loc("no id") },
            { id: "b", text: "not localized" },
            { id: "c", text: loc("C") },
            { id: "d", text: loc("D") },
            { id: "e", text: loc("E") },
          ],
        },
      ],
    });
    expect(stageOf(eco, "harvest").points.map((p) => p.id)).toEqual(["a", "c", "d"]);
    expect(stageOf(eco, "packaging").points).toHaveLength(3);
  });

  it("falls back to the default description for an empty locale", () => {
    const eco = load({
      stages: [{ id: "logistics", description: loc("Custom", "") }],
    });
    const d = stageOf(eco, "logistics").description;
    expect(d.en).toBe("Custom");
    expect(d["pt-BR"]).toBe("Carrinhos, baldes e automação que mantêm a cadeia do frio em movimento.");
  });

  it("accepts only renderable images", () => {
    const img = (image: unknown) =>
      stageOf(load({ stages: [{ id: "harvest", image }] }), "harvest").image;
    const ok = [
      "/uploads/a.jpg",
      "/assets/homepage/a.webp",
      "https://proj.supabase.co/storage/v1/object/public/cms-media/a.png",
    ];
    for (const v of ok) expect(img(v)).toBe(v);
    const bad = [
      "http://proj.supabase.co/storage/v1/object/public/cms-media/a.png",
      "https://evil.com/storage/v1/object/public/cms-media/a.png",
      "https://proj.supabase.co/other/a.png",
      "https://proj.supabase.co/storage/v1/object/public/x/a.svg",
      "/uploads/a.svg?x=1",
      "/uploads/../secret.png",
      "//evil.com/assets/a.png",
      "/other/a.png",
      "javascript:alert(1)",
      "data:image/png;base64,AAAA",
      42,
      null,
      {},
      ["/uploads/a.jpg"],
      "/uploads/a.jpg?x=1",
      "/assets/a.jpg?",
      "/uploads/a.jpg#x",
      "/uploads/%2e%2e/secret.png",
      "/uploads/a.sv%67",
      "/uploads/a.svg/",
      "/uploads/",
      "/uploads/%ZZ.png",
    ];
    for (const v of bad) expect(img(v)).toBe("");
  });

  it("normalizes remote image URLs", () => {
    const eco = load({
      stages: [
        {
          id: "harvest",
          image: "https://proj.supabase.co/storage/v1/object/public/cms-media/a.png?x=1#y",
        },
      ],
    });
    expect(stageOf(eco, "harvest").image).toBe(
      "https://proj.supabase.co/storage/v1/object/public/cms-media/a.png"
    );
  });

  it("rejects remote images when no Supabase URL is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const eco = load({
      stages: [{ id: "harvest", image: "https://proj.supabase.co/storage/v1/object/public/a.png" }],
    });
    expect(stageOf(eco, "harvest").image).toBe("");
  });
});
