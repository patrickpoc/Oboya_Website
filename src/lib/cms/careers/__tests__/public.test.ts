import { describe, expect, it } from "vitest";
import {
  buildJobPostingJsonLd,
  countryFacets,
  departmentFacets,
  filterPublicOpenings,
  isOpeningPublic,
  toPublicOpening,
} from "@/lib/cms/careers/public";
import { normalizeOpening } from "@/lib/cms/careers/validation";

const NOW = new Date("2026-10-20T12:00:00Z");
const loc = (en: string, extra: Record<string, string> = {}) => ({ en, "pt-BR": "", es: "", "zh-CN": "", ...extra });

function opening(over: Record<string, unknown> = {}) {
  return normalizeOpening({
    id: "id-1",
    slug: "grower",
    title: loc("Grower", { "pt-BR": "Produtor" }),
    summary: loc("Grow things"),
    description: loc("<p>desc</p>"),
    status: "published",
    countryCode: "BR",
    city: "São Paulo",
    department: "Ops",
    workModel: "hybrid",
    employmentType: "full_time",
    hiringManagerName: "Boss",
    recruiterId: "r1",
    createdBy: "u1",
    salaryMin: 100,
    salaryMax: 200,
    salaryCurrency: "BRL",
    salaryPeriod: "month",
    showSalary: false,
    ...over,
  });
}

describe("isOpeningPublic", () => {
  it.each([
    ["published", {}, true],
    ["draft with past publishAt", { status: "draft", publishAt: "2026-01-01T00:00:00Z" }, false],
    ["future publishAt", { publishAt: "2026-12-01T00:00:00Z" }, false],
    ["past publishAt", { publishAt: "2026-01-01T00:00:00Z" }, true],
    ["past closeAt", { closeAt: "2026-10-01T00:00:00Z" }, false],
    ["future closeAt", { closeAt: "2026-12-01T00:00:00Z" }, true],
    ["closed", { status: "closed" }, false],
    ["archived", { status: "archived" }, false],
  ])("%s", (_n, over, expected) => {
    expect(isOpeningPublic(opening(over), NOW)).toBe(expected);
  });
});

describe("toPublicOpening", () => {
  it("localizes with en fallback, sanitizes and strips internal fields", () => {
    const dto = toPublicOpening(opening(), "pt-BR", (h) => h.replace(/<p>/g, "<b>"));
    expect(dto.title).toBe("Produtor");
    expect(dto.summary).toBe("Grow things");
    expect(dto.descriptionHtml).toBe("<b>desc</p>");
    const json = JSON.stringify(dto);
    for (const k of ["id-1", "Boss", "recruiter", "createdBy", "status", "hiringManager"]) {
      expect(json).not.toContain(k);
    }
    expect(dto.salary).toBeUndefined();
    expect(dto.postedAt).toBeTruthy();
  });

  it("includes salary only when showSalary", () => {
    const dto = toPublicOpening(opening({ showSalary: true }), "en", (h) => h);
    expect(dto.salary).toEqual({ min: 100, max: 200, currency: "BRL", period: "month" });
  });
});

describe("filters and facets", () => {
  const a = toPublicOpening(opening(), "en", (h) => h);
  const b = toPublicOpening(
    opening({ slug: "se", title: loc("Água Engineer"), summary: loc("x"), countryCode: "SE", city: "Malmö", department: "Eng", workModel: "remote", employmentType: "contract" }),
    "en",
    (h) => h
  );
  const list = [a, b];

  it("filters by every criterion", () => {
    expect(filterPublicOpenings(list, { country: "se" })).toEqual([b]);
    expect(filterPublicOpenings(list, { department: "Ops" })).toEqual([a]);
    expect(filterPublicOpenings(list, { workModel: "remote" })).toEqual([b]);
    expect(filterPublicOpenings(list, { type: "full_time" })).toEqual([a]);
    expect(filterPublicOpenings(list, {})).toHaveLength(2);
  });

  it("matches q case- and accent-insensitively", () => {
    expect(filterPublicOpenings(list, { q: "AGUA" })).toEqual([b]);
    expect(filterPublicOpenings(list, { q: "sao paulo" })).toEqual([a]);
    expect(filterPublicOpenings(list, { q: "zzz" })).toEqual([]);
  });

  it("builds facets", () => {
    expect(countryFacets([a, a, b])).toEqual([{ code: "BR", count: 2 }, { code: "SE", count: 1 }]);
    expect(departmentFacets(list)).toEqual([{ name: "Eng", count: 1 }, { name: "Ops", count: 1 }]);
  });
});

describe("buildJobPostingJsonLd", () => {
  const org = { url: "https://x.test/en/work/grower", orgName: "Oboya", orgUrl: "https://x.test" };

  it("has the JobPosting shape without optional parts", () => {
    const ld = buildJobPostingJsonLd(toPublicOpening(opening(), "en", (h) => h), org);
    expect(ld["@type"]).toBe("JobPosting");
    expect(ld.employmentType).toBe("FULL_TIME");
    expect(ld.validThrough).toBeUndefined();
    expect(ld.baseSalary).toBeUndefined();
    expect(ld.jobLocationType).toBeUndefined();
    expect((ld.jobLocation as { address: { addressCountry: string } }).address.addressCountry).toBe("BR");
  });

  it("adds salary, validThrough and telecommute", () => {
    const dto = toPublicOpening(
      opening({ showSalary: true, closeAt: "2026-12-01T00:00:00Z", workModel: "remote", employmentType: "apprenticeship" }),
      "en",
      (h) => h
    );
    const ld = buildJobPostingJsonLd(dto, org);
    expect(ld.validThrough).toBe("2026-12-01T00:00:00Z");
    expect(ld.employmentType).toBe("OTHER");
    expect(ld.jobLocationType).toBe("TELECOMMUTE");
    expect(ld.applicantLocationRequirements).toEqual({ "@type": "Country", name: "BR" });
    expect(JSON.stringify(ld.baseSalary)).toContain("MONTH");
  });

  it("uses the resolved country name and omits location data without a country", () => {
    const remote = toPublicOpening(opening({ workModel: "remote" }), "en", (h) => h);
    const named = buildJobPostingJsonLd(remote, org, (c) => (c === "BR" ? "Brazil" : undefined));
    expect(named.applicantLocationRequirements).toEqual({ "@type": "Country", name: "Brazil" });
    expect(buildJobPostingJsonLd(remote, org, "Brazil").applicantLocationRequirements).toMatchObject({ name: "Brazil" });
    const none = buildJobPostingJsonLd({ ...remote, countryCode: undefined }, org);
    expect(none.jobLocation).toBeUndefined();
    expect(none.jobLocationType).toBeUndefined();
    expect(none.applicantLocationRequirements).toBeUndefined();
  });

  it("leaves `<` for the caller to escape", () => {
    const dto = toPublicOpening(opening({ title: loc("<b>x") }), "en", (h) => h);
    const out = JSON.stringify(buildJobPostingJsonLd(dto, org)).replace(/</g, "\\u003c");
    expect(out).not.toContain("<");
  });
});
