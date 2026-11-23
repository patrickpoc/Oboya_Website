import { describe, expect, it } from "vitest";
import {
  CONTACT_REGION_IDS,
  DEFAULT_CONTACT_TEAM,
  normalizeContactTeam,
} from "@/lib/cms/repositories/contact-team-repository";

const base = {
  name: "A",
  email: "a@oboya.cc",
  phone: "1",
  countryCode: "pl",
  region: "europe",
  sortOrder: 0,
};

describe("contact team", () => {
  it("seeds five default people, all enabled and valid", () => {
    expect(DEFAULT_CONTACT_TEAM).toHaveLength(5);
    expect(DEFAULT_CONTACT_TEAM.every((p) => p.enabled && !p.photo)).toBe(true);
    expect(normalizeContactTeam(DEFAULT_CONTACT_TEAM)).toHaveLength(5);
  });

  it("drops invalid entries and duplicates", () => {
    const out = normalizeContactTeam([
      { ...base, id: "ok" },
      { ...base, id: "ok" },
      { ...base, id: "" },
      { ...base, id: "noname", name: " " },
      { ...base, id: "badregion", region: "mars" },
      null,
      "x",
    ]);
    expect(out.map((p) => p.id)).toEqual(["ok"]);
    expect(normalizeContactTeam("nope")).toEqual([]);
  });

  it("defaults enabled to true and uppercases the country", () => {
    const [p] = normalizeContactTeam([{ ...base, id: "a" }]);
    expect(p.enabled).toBe(true);
    expect(p.countryCode).toBe("PL");
    expect(normalizeContactTeam([{ ...base, id: "b", enabled: false }])[0].enabled).toBe(false);
  });

  it("sanitizes email, phone, country, sortOrder and limits", () => {
    const [p] = normalizeContactTeam([
      { ...base, id: "a", email: "not an email", phone: "<script>", countryCode: "P1", sortOrder: 99999.7 },
    ]);
    expect(p).toMatchObject({ email: "", phone: "", countryCode: "", sortOrder: 10000 });
    expect(normalizeContactTeam([{ ...base, id: "n", sortOrder: -5 }])[0].sortOrder).toBe(0);
    expect(normalizeContactTeam([{ ...base, id: "x".repeat(121) }])).toEqual([]);
    expect(normalizeContactTeam([{ ...base, id: "l", name: "n".repeat(121) }])).toEqual([]);
    const many = Array.from({ length: 150 }, (_, i) => ({ ...base, id: `p${i}`, sortOrder: i }));
    expect(normalizeContactTeam(many)).toHaveLength(100);
  });

  it("keeps only safe photo sources", () => {
    const photo = (v: unknown) => normalizeContactTeam([{ ...base, id: "a", photo: v }])[0].photo;
    expect(photo("/uploads/team/a.jpg")).toBe("/uploads/team/a.jpg");
    expect(photo("javascript:alert(1)")).toBeUndefined();
    expect(photo("https://evil.example/a.jpg")).toBeUndefined();
    expect(photo("/uploads/../etc/a.jpg")).toBeUndefined();
    expect(photo(42)).toBeUndefined();
  });

  it("sorts by region order then sortOrder", () => {
    const out = normalizeContactTeam([
      { ...base, id: "asia", region: "asia" },
      { ...base, id: "eu2", sortOrder: 2 },
      { ...base, id: "eu1", sortOrder: 1 },
      { ...base, id: "na", region: "north-america" },
    ]);
    expect(out.map((p) => p.id)).toEqual(["na", "eu1", "eu2", "asia"]);
    expect(CONTACT_REGION_IDS[0]).toBe("north-america");
  });
});
