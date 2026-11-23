import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getHomepageSettings,
  replaceHomepageSettingsCache,
  resetHomepageSettings,
  type HomepageSettings,
} from "@/lib/cms/repositories/homepage-repository";

const loc = (en: string) => ({ en, "pt-BR": "", es: "", "zh-CN": "" });
const pt = (id: string, x: unknown, y: unknown, en = "Caption") => ({ id, caption: loc(en), x, y });

function load(patch: unknown) {
  const doc = { ...(resetHomepageSettings() as unknown as Record<string, unknown>) };
  if (patch === undefined) delete doc.challenges;
  else doc.challenges = patch;
  replaceHomepageSettingsCache(doc as unknown as HomepageSettings);
  return getHomepageSettings().challenges;
}

describe("challenges settings", () => {
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co"));
  afterEach(() => vi.unstubAllEnvs());

  it("has defaults and enabled toggle", () => {
    const c = load(undefined);
    expect(c.title.en).toBe("Built Around the Challenges Facing Horticulture Today");
    expect(c.image).toBe("/assets/homepage/challenges-greenhouse-final.jpg");
    expect(c.points.map((p) => p.id)).toEqual(["p1", "p2", "p3", "p4"]);
    expect(getHomepageSettings().sections.challenges.enabled).toBe(true);
  });

  it("merges stored values and keeps order", () => {
    const c = load({
      title: loc("Custom"),
      image: "/uploads/x.jpg",
      points: [pt("b", 10, 20, "B"), pt("a", 30, 40, "A")],
    });
    expect(c.title.en).toBe("Custom");
    expect(c.image).toBe("/uploads/x.jpg");
    expect(c.points.map((p) => p.id)).toEqual(["b", "a"]);
  });

  it("clamps coordinates and drops invalid points", () => {
    const c = load({
      points: [
        pt("a", -5, 130),
        pt("b", "x", 10),
        pt("c", 10, NaN),
        pt("d", 10, 10, ""),
        { id: "e", x: 1, y: 1 },
        pt("f", 99.5, 0.5),
      ],
    });
    expect(c.points).toMatchObject([
      { id: "a", x: 0, y: 100 },
      { id: "f", x: 99.5, y: 0.5 },
    ]);
  });

  it("upgrades the old default photo and pin positions, keeping edited ones", () => {
    const c = load({
      image: "/assets/homepage/greenhouse-technology.webp",
      points: [pt("p1", 22, 55, "Mine"), pt("p2", 48, 83), pt("p3", 10, 10), pt("p4", 78, 58)],
    });
    expect(c.image).toBe("/assets/homepage/challenges-greenhouse-final.jpg");
    expect(c.points).toMatchObject([
      { id: "p1", x: 25, y: 68 },
      { id: "p2", x: 45, y: 75 },
      { id: "p3", x: 10, y: 10 },
      { id: "p4", x: 82, y: 59 },
    ]);
    expect(c.points[0].caption.en).toBe("Mine");
  });

  it("caps at 5 points and falls back on a bad image", () => {
    const c = load({
      image: "https://evil.example/a.jpg",
      points: Array.from({ length: 8 }, (_, i) => pt(`p${i}`, 1, 1, `c${i}`)),
    });
    expect(c.points).toHaveLength(5);
    expect(c.image).toBe("/assets/homepage/challenges-greenhouse-final.jpg");
  });
});
