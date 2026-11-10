import { describe, expect, it } from "vitest";
import { defaultSettings } from "@/lib/cms/repositories/about-page/defaults";
import {
  LEGACY_MISSION_BODY,
  LEGACY_VALUES,
  LEGACY_VISION_BODY,
} from "@/lib/cms/repositories/about-page/legacy-defaults";
import { normalizeAboutPageSettings } from "@/lib/cms/repositories/about-page/settings";

const OLD_IDS = LEGACY_VALUES.map((v) => v.id);

function legacySettings() {
  const s = defaultSettings();
  s.values.items = LEGACY_VALUES.map((v) => ({
    ...s.values.items[0],
    id: v.id,
    title: { ...v.title },
    description: { ...v.description },
  }));
  s.mission.body = { ...LEGACY_MISSION_BODY };
  s.vision.body = { ...LEGACY_VISION_BODY };
  return s;
}

describe("about page values/mission/vision", () => {
  it("defaults have 6 values in order", () => {
    expect(defaultSettings().values.items.map((i) => i.id)).toEqual([
      "innovation", "glocal", "quality", "sustainability", "integrity", "collaboration",
    ]);
  });

  it("replaces legacy values, mission and vision", () => {
    const d = defaultSettings();
    const out = normalizeAboutPageSettings(legacySettings());
    expect(out.values.items.map((i) => i.id)).toEqual(d.values.items.map((i) => i.id));
    expect(out.mission.body).toEqual(d.mission.body);
    expect(out.vision.body).toEqual(d.vision.body);
  });

  it("keeps values when one item was edited", () => {
    const s = legacySettings();
    s.values.items[2].description.en = "Custom edit";
    const out = normalizeAboutPageSettings(s);
    expect(out.values.items.map((i) => i.id)).toEqual(OLD_IDS);
    expect(out.values.items[2].description.en).toBe("Custom edit");
  });

  it("keeps mission/vision when any locale was edited", () => {
    const s = legacySettings();
    s.mission.body["pt-BR"] = "Missão editada";
    s.vision.body.en = "Custom vision";
    const out = normalizeAboutPageSettings(s);
    expect(out.mission.body["pt-BR"]).toBe("Missão editada");
    expect(out.vision.body.en).toBe("Custom vision");
  });

  it("keeps an intentionally empty values list", () => {
    const s = defaultSettings();
    s.values.items = [];
    expect(normalizeAboutPageSettings(s).values.items).toEqual([]);
  });
});
