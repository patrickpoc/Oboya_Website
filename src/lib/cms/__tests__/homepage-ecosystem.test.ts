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

  it("drops legacy stage items on load", () => {
    const eco = load({
      stages: [
        { id: "propagation", label: loc("P"), items: [{ id: "trays", text: loc("Mine") }] },
      ],
    });
    const p = stageOf(eco, "propagation");
    expect(p.label.en).toBe("P");
    expect("items" in p).toBe(false);
    expect(eco.stages.every((s) => !("items" in s))).toBe(true);
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
