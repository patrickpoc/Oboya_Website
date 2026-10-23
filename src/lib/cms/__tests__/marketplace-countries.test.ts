import { describe, expect, it } from "vitest";
import {
  applyRestrictiveCountryChanges,
  detectCountryConflicts,
  parseCountryChanges,
  sameCountries,
  snapshotAffectedCountries,
  countProductsByCountry,
  filterActiveCountries,
  normalizeCountriesPayload,
  splitRestrictiveCountryChanges,
} from "@/lib/cms/marketplace-countries";

const offices = new Map([["brazil-office", "BR"], ["us-office", "US"]]);
const br = {
  code: "br",
  name: "Brazil",
  currencies: ["brl", "USD"],
  defaultCurrency: "BRL",
  primaryOfficeId: "brazil-office",
};
const run = (countries: unknown[], currencies: unknown[] = ["BRL", "USD"]) =>
  normalizeCountriesPayload({ countries, currencies }, offices);

describe("normalizeCountriesPayload", () => {
  it("defaults active to true and uppercases codes", () => {
    const { countries } = run([br]);
    expect(countries[0]).toMatchObject({
      code: "BR",
      active: true,
      currencies: ["BRL", "USD"],
    });
  });
  it("keeps active=false", () => {
    expect(run([{ ...br, active: false }]).countries[0].active).toBe(false);
  });
  it("drops empty or unknown primary offices with a warning", () => {
    expect(run([{ ...br, primaryOfficeId: "" }]).countries[0].primaryOfficeId).toBeUndefined();
    const result = run([{ ...br, primaryOfficeId: "nope" }]);
    expect(result.countries[0].primaryOfficeId).toBeUndefined();
    expect(result.warnings[0]).toMatch(/nope/);
  });
  it("rejects a primary office of another country", () => {
    expect(() => run([{ ...br, primaryOfficeId: "us-office" }])).toThrow(/another country/);
  });
  it("keeps the previous primary office when the map is unavailable", () => {
    const previous = [{ ...br, code: "BR" }];
    const { countries, warnings } = normalizeCountriesPayload(
      { countries: [{ ...br, primaryOfficeId: "x" }], currencies: ["BRL", "USD"] },
      null,
      previous as never
    );
    expect(countries[0].primaryOfficeId).toBe("brazil-office");
    expect(warnings).toEqual([]);
  });
  it("rejects malformed entries", () => {
    expect(() => run([null])).toThrow(/Invalid country entry/);
    expect(() => run(["BR"])).toThrow(/Invalid country entry/);
    expect(() => run([{ ...br, primaryOfficeId: 5 }])).toThrow(/primary office/);
    expect(() => run([br], ["BRL", 5])).toThrow(/must be text/);
    expect(() => run([{ ...br, currencies: [{}] }])).toThrow(/must be text/);
  });
  it("caps currencies, country count and name length", () => {
    const many = Array.from({ length: 31 }, (_, i) => `AA${String.fromCharCode(65 + (i % 26))}${i > 25 ? "A" : ""}`);
    expect(() => run([br], many)).toThrow(/At most/);
    expect(() => run(new Array(500).fill(br))).toThrow(/Too many/);
    expect(run([{ ...br, name: "x".repeat(200) }]).countries[0].name).toHaveLength(80);
  });
  it("rejects bad input", () => {
    expect(() => run([{ ...br, code: "ZZ" }])).toThrow(/Invalid country code/);
    expect(() => run([br, br])).toThrow(/Duplicate/);
    expect(() => run([{ ...br, currencies: ["EUR"], defaultCurrency: "EUR" }])).toThrow(/unknown currency/);
    expect(() => run([{ ...br, defaultCurrency: "EUR" }])).toThrow(/default currency/);
    expect(() => run([{ ...br, currencies: [] }])).toThrow(/at least one/);
    expect(() => run([br], [])).toThrow(/At least one currency/);
  });
});

describe("active filtering and counts", () => {
  it("treats missing active as active", () => {
    const list = [{ code: "A" }, { code: "B", active: false }, { code: "C", active: true }];
    expect(filterActiveCountries(list).map((c) => c.code)).toEqual(["A", "C"]);
  });
  it("counts enabled flags per country", () => {
    expect(
      countProductsByCountry([
        { enabledCountries: { BR: true, US: false } },
        { availability: { BR: true } },
      ])
    ).toEqual({ BR: 2 });
  });
});

describe("restrictive country changes", () => {
  const c = (code: string, active = true) => ({
    code,
    name: code,
    currencies: ["USD"],
    defaultCurrency: "USD",
    active,
  });
  it("splits deactivation and removal from direct changes", () => {
    const current = [c("BR"), c("US"), c("MX")];
    const proposed = [c("BR", false), c("US"), c("AR")];
    const { direct, deactivate, remove } = splitRestrictiveCountryChanges(current, proposed);
    expect(deactivate).toEqual(["BR"]);
    expect(remove).toEqual(["MX"]);
    expect(direct.map((x) => [x.code, x.active])).toEqual([
      ["BR", true],
      ["US", true],
      ["AR", true],
      ["MX", true],
    ]);
  });
  it("applies approved changes onto the current state", () => {
    const out = applyRestrictiveCountryChanges([c("BR"), c("MX")], {
      deactivate: ["BR"],
      remove: ["MX"],
    });
    expect(out.map((x) => [x.code, x.active])).toEqual([["BR", false]]);
  });
});

describe("held country changes", () => {
  const c = (code: string, active = true) => ({
    code,
    name: code,
    currencies: ["USD"],
    defaultCurrency: "USD",
    active,
  });
  it("holds removal of an already-inactive country", () => {
    const { remove, deactivate } = splitRestrictiveCountryChanges([c("BR", false)], []);
    expect(remove).toEqual(["BR"]);
    expect(deactivate).toEqual([]);
  });
  it("validates the stored payload", () => {
    expect(parseCountryChanges({ deactivate: ["BR"], remove: [] })).toEqual({
      deactivate: ["BR"],
      remove: [],
    });
    expect(() => parseCountryChanges({ deactivate: ["br"], remove: [] })).toThrow();
    expect(() => parseCountryChanges({ deactivate: [], remove: "BR" })).toThrow();
    expect(() => parseCountryChanges({ deactivate: new Array(500).fill("BR"), remove: [] })).toThrow();
    expect(() => parseCountryChanges(null)).toThrow();
  });
  it("flags missing, inactive and changed countries", () => {
    const changes = { deactivate: ["BR", "US"], remove: ["MX"] };
    const snapshot = snapshotAffectedCountries([c("BR"), c("US"), c("MX")], changes);
    expect(detectCountryConflicts([c("BR"), c("US"), c("MX")], snapshot, changes)).toEqual([]);
    expect(
      detectCountryConflicts([c("BR", false), { ...c("US"), name: "Other" }], snapshot, changes)
    ).toEqual(["country_inactive:BR", "country_changed:US", "country_missing:MX"]);
  });
  it("compares country lists by code, ignoring order and default active", () => {
    const { active: _a, ...legacy } = c("BR");
    expect(sameCountries([legacy as never, c("US")], [c("US"), c("BR")])).toBe(true);
    expect(sameCountries([c("BR")], [c("BR", false)])).toBe(false);
  });
});
