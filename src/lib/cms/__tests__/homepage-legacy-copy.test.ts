/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";
import {
  getHomepageSettings,
  replaceHomepageSettingsCache,
  resetHomepageSettings,
  type HomepageSettings,
} from "@/lib/cms/repositories/homepage-repository";
import { LEGACY_HOME_COPY as OLD } from "@/lib/cms/homepage-legacy";

const defaults = () => resetHomepageSettings();

function load(patch: (doc: any) => void): HomepageSettings {
  const doc = structuredClone(defaults()) as any;
  patch(doc);
  replaceHomepageSettingsCache(doc as HomepageSettings);
  return getHomepageSettings();
}
const edited = (en: string) => ({ en, "pt-BR": en, es: en, "zh-CN": en });
const solutionOld = OLD.solutionDesc as Record<string, (typeof OLD)["ecoBodyP1"]>;

describe("homepage legacy copy upgrades", () => {
  it("ecosystem: old bodyP1/P2 become the three new paragraphs, edits kept", () => {
    const d = defaults().homeEcosystem;
    const up = load((doc) => {
      doc.homeEcosystem.bodyP1 = OLD.ecoBodyP1;
      doc.homeEcosystem.bodyP2 = OLD.ecoBodyP2;
      delete doc.homeEcosystem.bodyP3;
    }).homeEcosystem;
    expect(up.bodyP1.en).toBe("Success in horticulture depends on more than individual products.");
    expect(up.bodyP2.en).toMatch(/^It depends on how growing/);
    expect(up.bodyP3.en).toMatch(/^Oboya Horticulture offers solutions/);
    expect(up.bodyP3).toEqual(d.bodyP3);
    const kept = load((doc) => {
      doc.homeEcosystem.bodyP1 = edited("Mine");
      doc.homeEcosystem.bodyP2 = edited("Mine 2");
    }).homeEcosystem;
    expect(kept.bodyP1.en).toBe("Mine");
    expect(kept.bodyP2.en).toBe("Mine 2");
  });

  it("ecosystem: split only when both paragraphs are old; P3 and closingText are clearable", () => {
    const a = load((doc) => {
      doc.homeEcosystem.bodyP1 = OLD.ecoBodyP1;
      doc.homeEcosystem.bodyP2 = edited("Mine 2");
      delete doc.homeEcosystem.bodyP3;
    }).homeEcosystem;
    expect([a.bodyP1.en, a.bodyP2.en, a.bodyP3.en]).toEqual([OLD.ecoBodyP1.en, "Mine 2", ""]);
    const b = load((doc) => {
      doc.homeEcosystem.bodyP1 = edited("Mine 1");
      doc.homeEcosystem.bodyP2 = OLD.ecoBodyP2;
      delete doc.homeEcosystem.bodyP3;
    }).homeEcosystem;
    expect([b.bodyP1.en, b.bodyP2.en, b.bodyP3.en]).toEqual(["Mine 1", OLD.ecoBodyP2.en, ""]);
    const cleared = load((doc) => {
      doc.homeEcosystem.bodyP3 = edited("");
      doc.challenges.closingText = edited("");
    });
    expect(cleared.homeEcosystem.bodyP3.en).toBe("");
    expect(cleared.challenges.closingText.en).toBe("");
    const absent = load((doc) => { delete doc.challenges.closingText; });
    expect(absent.challenges.closingText.en).toMatch(/^Oboya Horticulture helps/);
  });

  it("capabilities: old item text upgraded, edited kept", () => {
    const item = (s: any) => s.capabilities.items.find((i: any) => i.id === "global-local");
    expect(
      item(load((doc) => { item(doc).description = OLD.capItem2Desc; })).description.en
    ).toBe(
      "A global network backed by international manufacturing, product development, and sourcing capabilities. With local responsiveness and deep horticulture expertise."
    );
    expect(item(load((doc) => { item(doc).description = edited("Custom"); })).description.en).toBe("Custom");
  });

  it("businessSolutions: old title becomes empty and old descriptions are upgraded", () => {
    const up = load((doc) => {
      doc.businessSolutions.title = OLD.solutionsTitle;
      for (const it of doc.businessSolutions.items) it.description = solutionOld[it.id];
    }).businessSolutions;
    expect(up.title.en).toBe("");
    expect(up.items.map((i) => i.description.en)).toEqual([
      "Solutions for floriculture operations from propagation to retail.",
      "Solutions that support efficient production, handling, packaging, and commercialization.",
      "Solutions that optimize efficient cultivation, management, packaging and distribution.",
      "Systems that improve movement, merchandising, and point-of-sale presentation.",
      "Technology solutions that increase efficiency, consistency and expandability.",
    ]);
    const kept = load((doc) => {
      doc.businessSolutions.title = edited("My title");
      doc.businessSolutions.items[0].description = edited("My flowers");
    }).businessSolutions;
    expect(kept.title.en).toBe("My title");
    expect(kept.items[0].description.en).toBe("My flowers");
    expect(defaults().businessSolutions.title.en).toBe("");
  });

  it("challenges: old 3 points become the 4 new ones, edited points kept", () => {
    const up = load((doc) => {
      doc.challenges.points = OLD.challengePoints.map((caption, i) => ({ id: `p${i + 1}`, caption, x: 10, y: 10 }));
      delete doc.challenges.closingText;
    }).challenges;
    expect(up.points.map((p) => p.caption.en)).toEqual([
      "Increasing labor pressures.",
      "Growing quality expectations.",
      "More complex supply chains.",
      "Greater demands for operational efficiency.",
    ]);
    expect(up.closingText.en).toMatch(/^Oboya Horticulture helps horticultural businesses/);
    const kept = load((doc) => {
      doc.challenges.points = [
        { id: "p1", caption: edited("Mine"), x: 10, y: 10 },
        { id: "p2", caption: OLD.challengePoints[1], x: 20, y: 20 },
        { id: "p3", caption: OLD.challengePoints[2], x: 30, y: 30 },
      ];
    }).challenges;
    expect(kept.points).toHaveLength(3);
    expect(kept.points[0].caption.en).toBe("Mine");
  });

  it("testimonials: original six and interim five become the new seven, edited set kept", () => {
    const items = (set: unknown[][], first?: unknown) =>
      set.map(([quote, author, role], i) => ({
        id: `t${i + 1}`,
        quote: i === 0 && first ? first : quote,
        author,
        role,
      }));
    for (const set of [OLD.testimonials, OLD.testimonials5]) {
      const up = load((doc) => { doc.testimonials.items = items(set); }).testimonials;
      expect(up.items).toHaveLength(7);
      expect(up.items[0].author.en).toBe("Betty Mesa");
      expect(up.items[1].author.en).toBe("Mariette Barnard");
      expect(up.items[6].author.en).toBe("Joost Kalanchoe");
    }
    const kept = load((doc) => { doc.testimonials.items = items(OLD.testimonials, edited("Mine")); }).testimonials;
    expect(kept.items).toHaveLength(6);
    expect(kept.items[0].quote.en).toBe("Mine");
  });

  it("partners: old title upgraded, edited kept", () => {
    expect(load((doc) => { doc.partners.title = OLD.partnersTitle; }).partners.title.en).toBe("Certifications & Standards");
    expect(load((doc) => { doc.partners.title = edited("Mine"); }).partners.title.en).toBe("Mine");
  });

  it("testimonials eyebrow: old default upgraded, edited kept", () => {
    expect(load((doc) => { doc.testimonials.eyebrow = OLD.testimonialsEyebrow; }).testimonials.eyebrow.en).toBe("Real Results. Real Partnerships.");
    expect(load((doc) => { doc.testimonials.eyebrow = edited("Mine"); }).testimonials.eyebrow.en).toBe("Mine");
  });
});
