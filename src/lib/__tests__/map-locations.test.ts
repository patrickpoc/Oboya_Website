import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  normalizeMapLocations,
  resolveMapLocationsForLocale,
  stripHiddenOfficeContacts,
  validateMapLocations,
} from "../map-locations";

const tr = (extra: Record<string, string> = {}) => ({
  company: "",
  partner: "",
  operationType: "",
  city: "",
  registeredAddress: "",
  facility: "",
  segments: "",
  phone: "",
  businessHours: "",
  ...extra,
});

function raw(office: Record<string, unknown>, flag = "NL") {
  const t = { en: tr({ phone: "+1" }), "pt-BR": tr({ phone: "+2" }) };
  return {
    viewBox: { width: 100, height: 100 },
    locations: [
      {
        id: "loc",
        x: 1,
        y: 2,
        flag,
        translations: { en: { country: "X" } },
        offices: [{ id: "o1", email: "a@b.com", translations: t, ...office }],
      },
    ],
  };
}

const office = (data: ReturnType<typeof normalizeMapLocations>) =>
  data.locations[0].offices[0];

describe("normalize flags", () => {
  it("defaults to true when missing or non-boolean", () => {
    for (const v of [undefined, true, "no", 0, null]) {
      const o = office(normalizeMapLocations(raw({ showEmail: v, showPhone: v })));
      expect(o.showEmail).toBe(true);
      expect(o.showPhone).toBe(true);
    }
  });

  it("keeps false", () => {
    const o = office(
      normalizeMapLocations(raw({ showEmail: false, showPhone: false }))
    );
    expect(o.showEmail).toBe(false);
    expect(o.showPhone).toBe(false);
  });

  it("defaults flags for legacy locations without offices", () => {
    const data = normalizeMapLocations({
      viewBox: { width: 1, height: 1 },
      locations: [{ id: "a", x: 1, y: 1, flag: "", translations: {} }],
    });
    expect(office(data).showEmail).toBe(true);
    expect(office(data).showPhone).toBe(true);
  });

  it("round-trips registeredAddress and fills empty", () => {
    const data = normalizeMapLocations(
      raw({
        translations: {
          en: tr({ registeredAddress: "Street 1" }),
        },
      })
    );
    expect(office(data).translations.en.registeredAddress).toBe("Street 1");
    expect(office(data).translations.es.registeredAddress).toBe("");
  });
});

describe("resolve and strip", () => {
  it("resolver hides email/phone when toggled off", () => {
    const data = normalizeMapLocations(
      raw({ showEmail: false, showPhone: false })
    );
    const [r] = resolveMapLocationsForLocale(data.locations, "en");
    expect(r.offices[0].email).toBe("");
    expect(r.offices[0].phone).toBe("");
    expect("showEmail" in r.offices[0]).toBe(false);
  });

  it("resolver leaves visible offices unchanged", () => {
    const data = normalizeMapLocations(raw({}));
    const [r] = resolveMapLocationsForLocale(data.locations, "en");
    expect(r.offices[0].email).toBe("a@b.com");
    expect(r.offices[0].phone).toBe("+1");
  });

  it("strip blanks all locales, keeps flags, does not mutate, stays valid", () => {
    const data = normalizeMapLocations(
      raw({ showEmail: false, showPhone: false })
    );
    const before = JSON.stringify(data);
    const out = stripHiddenOfficeContacts(data);
    expect(JSON.stringify(data)).toBe(before);
    const o = out.locations[0].offices[0];
    expect(o.email).toBe("");
    expect(o.showEmail).toBe(false);
    expect(o.translations["pt-BR"].phone).toBe("");
    expect(o.translations.en.phone).toBe("");
    expect(validateMapLocations(out)).toEqual([]);
  });

  it("strip only affects the toggled-off field", () => {
    const data = normalizeMapLocations(raw({ showPhone: false }));
    const o = stripHiddenOfficeContacts(data).locations[0].offices[0];
    expect(o.email).toBe("a@b.com");
    expect(o.translations.en.phone).toBe("");
  });
});

describe("validate", () => {
  it("accepts flag NL", () => {
    expect(validateMapLocations(raw({}, "NL"))).toEqual([]);
  });
});

describe("office length limits", () => {
  const errs = (o: Record<string, unknown>) => validateMapLocations(raw(o));

  it("accepts values at the limits", () => {
    const t = { en: tr({ registeredAddress: "a".repeat(500), city: "b".repeat(200) }) };
    expect(errs({ email: "e".repeat(254), translations: t })).toEqual([]);
  });

  it("rejects oversized values", () => {
    expect(errs({ email: "e".repeat(255) }).length).toBeGreaterThan(0);
    const addr = { en: tr({ registeredAddress: "a".repeat(501) }) };
    expect(errs({ translations: addr }).length).toBeGreaterThan(0);
    const city = { en: tr({ city: "b".repeat(201) }) };
    expect(errs({ translations: city }).length).toBeGreaterThan(0);
  });
});

describe("data/map-locations.json", () => {
  it("never commits hidden contacts and stays valid", () => {
    const json = JSON.parse(
      readFileSync(join(process.cwd(), "data/map-locations.json"), "utf8")
    );
    for (const l of json.locations)
      for (const o of l.offices ?? []) {
        expect(o.showEmail).not.toBe(false);
        expect(o.showPhone).not.toBe(false);
      }
    expect(validateMapLocations(json)).toEqual([]);
  });
});
