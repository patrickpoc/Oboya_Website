import { describe, expect, it } from "vitest";
import {
  applicationsToCsv,
  safeCell,
  countByPipelineStatus,
  matchesApplicationFilters,
  matchesOpeningFilters,
} from "@/lib/cms/careers/filters";
import { normalizeApplication, normalizeOpening } from "@/lib/cms/careers/validation";

const opening = (o: Record<string, unknown> = {}) =>
  normalizeOpening({ id: "o1", title: { en: "Sales Engineer" }, department: "Sales", countryCode: "nl", workModel: "hybrid", ...o });
const app = (o: Record<string, unknown> = {}) =>
  normalizeApplication({ id: "a1", openingId: "o1", fullName: "Ana Costa", email: "ana@x.com", consentPrivacy: true, source: "linkedin", ...o });

describe("opening filters", () => {
  it("hides archived by default and matches other filters", () => {
    expect(matchesOpeningFilters(opening(), {})).toBe(true);
    expect(matchesOpeningFilters(opening({ status: "archived" }), {})).toBe(false);
    expect(matchesOpeningFilters(opening({ status: "archived" }), { status: "all" })).toBe(true);
    expect(matchesOpeningFilters(opening({ status: "closed" }), { status: "published" })).toBe(false);
    expect(matchesOpeningFilters(opening(), { department: "Sales", countryCode: "NL", workModel: "hybrid" })).toBe(true);
    expect(matchesOpeningFilters(opening(), { workModel: "remote" })).toBe(false);
    expect(matchesOpeningFilters(opening(), { q: "engineer" })).toBe(true);
    expect(matchesOpeningFilters(opening(), { q: "nurse" })).toBe(false);
  });
});

describe("application filters", () => {
  it("filters by opening, talent pool, status, source and query", () => {
    expect(matchesApplicationFilters(app(), { openingId: "o1" })).toBe(true);
    expect(matchesApplicationFilters(app(), { openingId: "o2" })).toBe(false);
    expect(matchesApplicationFilters(app({ openingId: null }), { openingId: "talent_pool" })).toBe(true);
    expect(matchesApplicationFilters(app(), { openingId: "talent_pool" })).toBe(false);
    expect(matchesApplicationFilters(app(), { status: "screening" })).toBe(false);
    expect(matchesApplicationFilters(app(), { source: "linkedin", q: "ANA@" })).toBe(true);
  });

  it("counts by pipeline status", () => {
    const counts = countByPipelineStatus([app(), app(), app({ status: "hired" })]);
    expect(counts.total).toBe(3);
    expect(counts.new).toBe(2);
    expect(counts.hired).toBe(1);
    expect(counts.offer).toBe(0);
  });
});

describe("applicationsToCsv", () => {
  it("emits header, resolves opening titles, escapes and neutralizes formulas", () => {
    const csv = applicationsToCsv(
      [app({ fullName: '=cmd|"x"', currentCompany: "A, B", tags: ["a", "b"] })],
      { o1: "Sales Engineer" }
    );
    const [header, row] = csv.split("\n");
    expect(header.startsWith("id,createdAt,opening,status")).toBe(true);
    expect(row).toContain("Sales Engineer");
    expect(row).toContain(`"'=cmd|""x"""`);
    expect(row).toContain('"A, B"');
    expect(row).toContain("a|b");
  });
});

describe("csv formula guard", () => {
  it("prefixes formulas, including after leading whitespace and tab/CR", () => {
    expect(safeCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(safeCell("  =cmd")).toBe("'  =cmd");
    expect(safeCell("\t@x")).toBe("'\t@x");
    expect(safeCell("\rfoo")).toContain("'");
    expect(safeCell("Ana")).toBe("Ana");
  });
});
