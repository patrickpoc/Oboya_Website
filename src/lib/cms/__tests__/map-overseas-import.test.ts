import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  normalizeMapLocations,
  validateMapLocations,
  type MapOffice,
} from "@/lib/map-locations";
import { locales } from "@/i18n/routing";
import { mergeOverseasCompanies, parseOverseasSeed } from "../map-overseas-import";

const read = (p: string) => JSON.parse(readFileSync(p, "utf8"));
const rawSeed = read("data/cms/overseas-companies.json");
const seed = parseOverseasSeed(rawSeed);
const base = normalizeMapLocations({
  viewBox: { width: 1, height: 1 },
  locations: ["mexico", "argentina", "ethiopia", "china", "singapore", "brazil", "usa", "norway", "england"].map(
    (id, i) => ({
      id,
      x: i,
      y: i,
      flag: "",
      translations: {},
      offices: [
        { id: `${id}-office`, email: `${id}@oboya.example` },
        ...(id === "usa" ? [{ id: "usa-sales", email: "sales@oboya.com" }] : []),
      ],
    })
  ),
});
const find = (d: typeof base, id: string) => d.locations.find((l) => l.id === id)!;

describe("overseas seed file", () => {
  it("has 24 whitelisted entries without row 22", () => {
    expect(rawSeed).toHaveLength(24);
    expect(rawSeed.some((r: { row: number }) => r.row === 22)).toBe(false);
    for (const r of rawSeed)
      expect(Object.keys(r).sort()).toEqual(
        ["city", "company", "locationId", "registeredAddress", "row"]
      );
  });
  it("parse drops unknown properties", () => {
    const [c] = parseOverseasSeed([{ locationId: "a", company: "X", taxId: "1", row: 3 }]);
    expect(c).toEqual({ locationId: "a", company: "X", city: "", registeredAddress: "" });
  });
});

describe("mergeOverseasCompanies", () => {
  const { data, summary } = mergeOverseasCompanies(base, seed);

  it("leaves unseeded locations unchanged", () => {
    for (const id of ["mexico", "argentina", "ethiopia", "china", "singapore"])
      expect(find(data, id)).toEqual(find(base, id));
  });
  it("keeps non-placeholder offices and reuses placeholder ids", () => {
    expect(find(data, "usa").offices.some((o) => o.id === "usa-sales")).toBe(true);
    for (const id of ["brazil-office", "usa-office", "norway-office", "england-office"])
      expect(data.locations.flatMap((l) => l.offices).some((o) => o.id === id)).toBe(true);
    const unseeded = ["mexico", "argentina", "ethiopia", "china", "singapore"];
    for (const l of data.locations) {
      const hasPlaceholder = l.offices.some((o) => o.email.endsWith("@oboya.example"));
      expect(hasPlaceholder).toBe(unseeded.includes(l.id));
    }
  });
  it("creates netherlands once with flag NL", () => {
    expect(data.locations.filter((l) => l.id === "netherlands")).toHaveLength(1);
    expect(find(data, "netherlands").flag).toBe("NL");
    expect(summary.createdLocations).toEqual(["netherlands"]);
  });
  it("shapes seeded offices", () => {
    const o = find(data, "brazil").offices.find((x) => x.translations.en.company)!;
    expect(o.email).toBe("");
    expect(o.showEmail && o.showPhone).toBe(true);
    for (const l of locales) {
      expect(o.translations[l].company).toBe(o.translations.en.company);
      expect(o.translations[l].registeredAddress).toBe(o.translations.en.registeredAddress);
    }
    expect(Object.keys(o).sort()).toEqual(["email", "id", "showEmail", "showPhone", "translations"]);
  });
  it("does not duplicate existing companies (case-insensitive)", () => {
    const first = seed.find((s) => s.locationId === "brazil")!;
    const withExisting = structuredClone(base);
    find(withExisting, "brazil").offices[0].email = "x@oboya.com";
    find(withExisting, "brazil").offices[0].translations.es.company = first.company.toUpperCase();
    const res = mergeOverseasCompanies(withExisting, [first]);
    expect(res.summary.added).toBe(0);
  });
  it("is idempotent and valid", () => {
    const again = mergeOverseasCompanies(data, seed);
    expect(again.data).toEqual(data);
    expect(again.summary.added).toBe(0);
    expect(validateMapLocations(data)).toEqual([]);
  });
});

describe("data/map-locations.json", () => {
  const raw = read("data/map-locations.json");
  const file = normalizeMapLocations(raw);
  it("is a fixed point of the merge", () => {
    expect(file).toEqual(raw);
    expect(mergeOverseasCompanies(file, seed).data).toEqual(file);
    expect(validateMapLocations(file)).toEqual([]);
  });
});
