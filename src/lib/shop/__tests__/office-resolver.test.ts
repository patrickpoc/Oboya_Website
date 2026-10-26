import { describe, expect, it } from "vitest";
import { getPrimaryOfficeByCountryCode } from "@/lib/shop/office-resolver";
import type { MapLocationsData } from "@/lib/map-locations";
import countries from "../../../../data/shop/countries.json";
import mapData from "../../../../data/map-locations.json";

function makeData(flags: { showEmail: boolean; showPhone: boolean }): MapLocationsData {
  const tr = (extra: Record<string, string> = {}) => ({
    company: "Acme",
    partner: "",
    operationType: "",
    city: "Atlanta",
    facility: "",
    segments: "",
    phone: "+1 555 0100",
    registeredAddress: "",
    ...extra,
  });
  return {
    viewBox: { width: 100, height: 100 },
    locations: [
      {
        id: "usa",
        x: 1,
        y: 1,
        flag: "US",
        hasFactories: false,
        sendOnly: false,
        translations: {
          en: { country: "USA" },
          "pt-BR": { country: "USA" },
          es: { country: "USA" },
          "zh-CN": { country: "USA" },
        },
        offices: [
          {
            id: "usa-office",
            email: "usa@acme.com",
            ...flags,
            translations: { en: tr(), "pt-BR": tr(), es: tr(), "zh-CN": tr() },
          },
        ],
      },
    ],
  } as unknown as MapLocationsData;
}

describe("getPrimaryOfficeByCountryCode", () => {
  it("blanks email and phone when hidden", () => {
    const office = getPrimaryOfficeByCountryCode(
      "US",
      "en",
      makeData({ showEmail: false, showPhone: false })
    );
    expect(office?.officeId).toBe("usa-office");
    expect(office?.email).toBe("");
    expect(office?.phone).toBe("");
  });

  it("keeps email and phone when visible", () => {
    const office = getPrimaryOfficeByCountryCode(
      "US",
      "en",
      makeData({ showEmail: true, showPhone: true })
    );
    expect(office?.email).toBe("usa@acme.com");
    expect(office?.phone).toBe("+1 555 0100");
  });

  it("every primaryOfficeId in countries.json exists in map-locations.json", () => {
    const officeIds = new Set(
      (mapData as { locations: { offices: { id: string }[] }[] }).locations.flatMap(
        (l) => l.offices.map((o) => o.id)
      )
    );
    const primaryIds = (countries as { primaryOfficeId?: string }[])
      .map((c) => c.primaryOfficeId)
      .filter((id): id is string => Boolean(id));
    expect(primaryIds.length).toBeGreaterThan(0);
    expect(primaryIds.filter((id) => !officeIds.has(id))).toEqual([]);
  });
});
