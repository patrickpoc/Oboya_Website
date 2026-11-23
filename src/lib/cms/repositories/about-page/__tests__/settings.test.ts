import { describe, expect, it } from "vitest";
import { defaultSettings } from "@/lib/cms/repositories/about-page/defaults";
import {
  LEGACY_CULTURE_IMAGE_SRC,
  LEGACY_INSTITUTIONAL_IMAGE_SRC_JPG,
  LEGACY_MISSION_BODY,
  LEGACY_MISSION_IMAGE_SRC,
  LEGACY_VISION_IMAGE_SRC,
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

describe("about page impact stats", () => {
  const ids = (s: ReturnType<typeof defaultSettings>) => normalizeAboutPageSettings(s).impact.stats.map((i) => i.id);

  it("defaults have 6 stats in order", () => {
    expect(defaultSettings().impact.stats.map((i) => i.id)).toEqual([
      "countries", "manufacturing", "offices", "employees", "products", "years",
    ]);
  });

  it("drops the unchanged legacy clients stat", () => {
    const s = defaultSettings();
    s.impact.stats.splice(4, 0, { ...s.impact.stats[0], id: "clients", value: 1, suffix: "m+" });
    expect(ids(s)).not.toContain("clients");
    expect(ids(s)).toHaveLength(6);
  });

  it("keeps an edited clients stat", () => {
    const s = defaultSettings();
    s.impact.stats.splice(4, 0, { ...s.impact.stats[0], id: "clients", value: 2, suffix: "m+" });
    expect(ids(s)).toContain("clients");
  });
});

describe("about page callout body", () => {
  const OLD_SINGLE =
    "Many suppliers focus on individual categories. Oboya Horticulture takes a wider perspective. By offering solutions across multiple stages of the horticultural journey, we help customers improve efficiency, protect quality, optimize resources, and create long-term value throughout their operations.";

  const bodyEn = (s: ReturnType<typeof defaultSettings>) => s.callout.body?.en;
  const withBody = (en: string) => {
    const s = defaultSettings();
    s.callout.body = { ...defaultSettings().callout.body!, en };
    return s;
  };

  it("default body has two paragraphs", () => {
    expect(bodyEn(defaultSettings())).toContain("wider perspective.\n\nBy offering");
  });

  it("upgrades the old single-paragraph default", () => {
    expect(bodyEn(normalizeAboutPageSettings(withBody(OLD_SINGLE)))).toBe(bodyEn(defaultSettings()));
  });

  it("keeps an edited body", () => {
    const edited =
      "We create long-term value throughout their operations with a custom intro written in the admin.";
    expect(bodyEn(normalizeAboutPageSettings(withBody(edited)))).toBe(edited);
  });
});

describe("about page impact title", () => {
  it("breaks the default title after 'Oboya Horticulture'", () => {
    expect(defaultSettings().impact.title.en).toBe("Oboya Horticulture\nin Numbers");
  });

  it("upgrades the old single-line title but keeps an edited one", () => {
    const old = defaultSettings();
    old.impact.title = { ...old.impact.title, en: "Oboya Horticulture in Numbers" };
    expect(normalizeAboutPageSettings(old).impact.title.en).toBe("Oboya Horticulture\nin Numbers");
    const edited = defaultSettings();
    edited.impact.title = { ...edited.impact.title, en: "Our impact" };
    expect(normalizeAboutPageSettings(edited).impact.title.en).toBe("Our impact");
  });
});

describe("about page legacy image upgrade", () => {
  it("upgrades old default images and keeps custom ones", () => {
    const d = defaultSettings();
    const s = defaultSettings();
    s.institutionalImage.src = LEGACY_INSTITUTIONAL_IMAGE_SRC_JPG;
    s.mission.images[0].src = LEGACY_MISSION_IMAGE_SRC;
    s.vision.images[0].src = LEGACY_VISION_IMAGE_SRC;
    s.culture.items[0].image = LEGACY_CULTURE_IMAGE_SRC;
    const out = normalizeAboutPageSettings(s);
    expect(out.institutionalImage.src).toBe("/assets/about/oboya-facility.jpg");
    expect(out.mission.images[0]).toEqual(d.mission.images[0]);
    expect(out.vision.images[0].src).toBe("/assets/about/vision-team.jpg");
    expect(out.culture.items[0].image).toBe("/assets/about/culture-aerial-logistics.jpg");

    const c = defaultSettings();
    c.mission.images[0].src = "/uploads/custom.jpg";
    expect(normalizeAboutPageSettings(c).mission.images[0].src).toBe("/uploads/custom.jpg");
  });
});
