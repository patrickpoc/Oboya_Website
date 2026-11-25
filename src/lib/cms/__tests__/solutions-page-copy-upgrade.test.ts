import { describe, expect, it } from "vitest";
import { normalizeSolutionsPageSettings } from "@/lib/cms/repositories/solutions-page-repository";

const en = (text: string) => ({ en: text, "pt-BR": "", es: "", "zh-CN": "" });

describe("solutions page copy upgrades", () => {
  it("upgrades the previous hero body default to the current one", () => {
    const out = normalizeSolutionsPageSettings({
      hero: {
        body: en(
          "Different crops, different markets, different operational realities.\nEvery business faces unique challenges, but the objective remains the same: improve performance, protect quality, and support sustainable growth.\nExplore solutions tailored to your sector and designed to support every stage of your horticultural operation."
        ),
      },
    });
    expect(out.hero.body.en).toMatch(/^Different crops, different markets and different operational realities\./);
  });

  it("upgrades old Flowers harvest/retail images and keeps custom ones", () => {
    const out = normalizeSolutionsPageSettings({
      banners: [
        { id: "harvest", cropImages: { flowers: "/assets/solutions/flowers/harvest.jpg" } },
        { id: "retail", cropImages: { flowers: "/uploads/my-retail.jpg" } },
      ],
    });
    const byId = Object.fromEntries(out.banners.map((b) => [b.id, b]));
    expect(byId.harvest.cropImages?.flowers).toBe("/assets/solutions/flowers/harvest-v2.jpg");
    expect(byId.retail.cropImages?.flowers).toBe("/uploads/my-retail.jpg");
  });

  it("uses the new crop photos and appends Automation & Machinery when missing", () => {
    const out = normalizeSolutionsPageSettings({
      banners: [
        {
          id: "harvest",
          cropImages: {
            vegetables: "/assets/solutions/vegetables/harvest.jpg",
            fruits: "/assets/solutions/fruits/harvest.jpg",
          },
        },
      ],
    });
    const harvest = out.banners.find((b) => b.id === "harvest");
    expect(harvest?.cropImages?.vegetables).toBe("/assets/solutions/vegetables/harvest-v2.jpg");
    expect(harvest?.cropImages?.fruits).toBe("/assets/solutions/fruits/harvest-v2.jpg");
    const automation = out.banners.find((b) => b.id === "automation");
    expect(automation?.title.en).toBe("Automation & Machinery");
    expect(automation?.cropImages?.flowers).toBe("/assets/solutions/flowers/automation-v2.jpg");
    expect(automation?.cropImages?.vegetables).toBe("/assets/solutions/vegetables/automation-v2.jpg");
    expect(automation?.cropImages?.fruits).toBe("/assets/solutions/fruits/automation.jpg");
  });

  it("upgrades the previous vegetables/fruits sector descriptions", () => {
    const out = normalizeSolutionsPageSettings({
      crops: [
        { id: "vegetables", description: en("Supporting efficient production, handling, packaging, and commercialization for vegetable and herb operations.") },
        { id: "fruits", description: en("My own fruit text.") },
      ],
    });
    const byId = Object.fromEntries(out.crops.map((c) => [c.id, c]));
    expect(byId.vegetables.description.en).toBe(
      "Solutions that support efficient production, handling, packaging, and commercialization."
    );
    expect(byId.fruits.description.en).toBe("My own fruit text.");
  });

  it("upgrades the previous CTA description and keeps an edited one", () => {
    const upgraded = normalizeSolutionsPageSettings({
      cta: {
        description: en(
          "In our work culture, honesty is a priority. We are here to offer you the solution you really need. Find out what it is here."
        ),
      },
    });
    expect(upgraded.cta.description.en).toMatch(/Click on the button below to find out what it is\.$/);
    expect(upgraded.cta.description["pt-BR"]).toMatch(/Clique no botão abaixo/);

    const kept = normalizeSolutionsPageSettings({ cta: { description: en("My own text.") } });
    expect(kept.cta.description.en).toBe("My own text.");
  });
});
