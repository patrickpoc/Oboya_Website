import { describe, expect, it } from "vitest";
import {
  CV_MAX_BYTES,
  CV_MIME_TYPES,
  isValidCvObjectPath,
  normalizeApplication,
  normalizeOpening,
  validateApplication,
  validateCvFile,
  validateOpening,
} from "@/lib/cms/careers/validation";
import { OPENING_STATUSES, PIPELINE_STATUSES } from "@/lib/cms/careers/types";

const UUID = "123e4567-e89b-42d3-a456-426614174000";
const UUID2 = "223e4567-e89b-42d3-a456-426614174111";

function errorsOf(result: ReturnType<typeof validateOpening>) {
  return result.ok ? [] : result.errors;
}

describe("constants", () => {
  it("mirror the SQL CHECK values", () => {
    expect(OPENING_STATUSES).toEqual(["draft", "published", "closed", "archived"]);
    expect(PIPELINE_STATUSES).toEqual([
      "new", "screening", "interview", "offer", "hired", "rejected", "withdrawn",
    ]);
    expect(CV_MAX_BYTES).toBe(10485760);
    expect(CV_MIME_TYPES).toHaveLength(3);
  });
});

describe("opening validation", () => {
  it("normalizes slug from the english title and applies defaults", () => {
    const o = normalizeOpening({ title: { en: "Sales Engineer ÇÃO" }, status: "bogus", workModel: "x" });
    expect(o.slug).toBe("sales-engineer-cao");
    expect(o.status).toBe("draft");
    expect(o.positions).toBe(1);
    expect(o.workModel).toBeUndefined();
    expect(o.title["pt-BR"]).toBe("");
  });

  it("requires title.en", () => {
    expect(errorsOf(validateOpening(normalizeOpening({ slug: "a" })))).toContain("titleRequired");
    expect(validateOpening(normalizeOpening({ title: { en: "Dev" } })).ok).toBe(true);
  });

  it("rejects bad positions, salary range and dates", () => {
    const o = normalizeOpening({
      title: { en: "Dev" },
      positions: 0,
      salaryMin: 100,
      salaryMax: 50,
      publishAt: "2026-10-10T00:00:00Z",
      closeAt: "2026-10-01T00:00:00Z",
    });
    expect(errorsOf(validateOpening(o))).toEqual(["positionsMin", "salaryRange", "closeBeforePublish"]);
  });
});

describe("application validation", () => {
  const valid = {
    fullName: "Ana Costa",
    email: " Ana@Example.com ",
    consentPrivacy: true,
    linkedinUrl: "https://linkedin.com/in/ana",
    yearsExperience: 5,
  };

  it("accepts a valid application and lowercases email", () => {
    const a = normalizeApplication(valid);
    expect(a.email).toBe("ana@example.com");
    expect(a.status).toBe("new");
    expect(validateApplication(a).ok).toBe(true);
  });

  it("rejects missing name, bad email, no consent, bad url, years out of range", () => {
    const a = normalizeApplication({
      email: "nope",
      linkedinUrl: "javascript:alert(1)",
      yearsExperience: 80,
    });
    const res = validateApplication(a);
    expect(res.ok ? [] : res.errors).toEqual([
      "nameRequired", "emailInvalid", "consentRequired", "urlInvalid", "yearsRange",
    ]);
  });

  it("drops invalid languages and normalizes tags", () => {
    const a = normalizeApplication({
      ...valid,
      languages: [{ code: "EN", level: "C1" }, { code: "pt", level: "Z9" }],
      tags: [" VIP ", "vip"],
    });
    expect(a.languages).toEqual([{ code: "en", level: "C1" }]);
    expect(a.tags).toEqual(["vip"]);
  });
});

describe("CV helpers", () => {
  it("validates mime and size", () => {
    expect(validateCvFile("application/pdf", 1000).ok).toBe(true);
    expect(validateCvFile("image/png", 1000).ok).toBe(false);
    expect(validateCvFile("application/pdf", CV_MAX_BYTES + 1).ok).toBe(false);
    expect(validateCvFile("application/pdf", 0).ok).toBe(false);
  });

  it("validates object paths and binds to the application id", () => {
    const path = `applications/${UUID}/cv-${UUID2}.pdf`;
    expect(isValidCvObjectPath(path)).toBe(true);
    expect(isValidCvObjectPath(path, UUID)).toBe(true);
    expect(isValidCvObjectPath(path, UUID2)).toBe(false);
    expect(isValidCvObjectPath(`applications/${UUID}/cv-${UUID2}.png`)).toBe(false);
    expect(isValidCvObjectPath(`applications/${UUID}/../x/cv-${UUID2}.pdf`)).toBe(false);
  });
});

describe("application field validation (no 500s)", () => {
  const base = { fullName: "Ana", email: "ana@x.com", consentPrivacy: true };
  const codes = (extra: Record<string, unknown>) => {
    const r = validateApplication(normalizeApplication({ ...base, ...extra }));
    return r.ok ? [] : r.errors;
  };

  it("rejects bad opening id, date and fractional notice period", () => {
    expect(codes({ openingId: "nope" })).toContain("openingInvalid");
    expect(codes({ openingId: UUID })).toEqual([]);
    expect(codes({ availabilityDate: "2026-13-40" })).toContain("dateInvalid");
    expect(codes({ availabilityDate: "tomorrow" })).toContain("dateInvalid");
    expect(codes({ availabilityDate: "2026-02-28" })).toEqual([]);
    expect(codes({ noticePeriodDays: 1.5 })).toContain("noticeRange");
    expect(codes({ noticePeriodDays: 30 })).toEqual([]);
  });
});

describe("opening seo whitelist", () => {
  it("keeps only title, description and noindex", () => {
    const o = normalizeOpening({
      title: { en: "A" },
      seo: { title: { en: "T".repeat(500) }, description: { en: "d" }, noindex: true, evil: "<script>" },
    });
    expect(Object.keys(o.seo ?? {}).sort()).toEqual(["description", "noindex", "title"]);
    expect((o.seo?.title as { en: string }).en).toHaveLength(120);
    expect(o.seo?.noindex).toBe(true);
  });
});
