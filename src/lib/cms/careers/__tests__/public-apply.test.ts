import { describe, expect, it } from "vitest";
import { looksLikeBot, parsePublicApplication } from "@/lib/cms/careers/public-apply";

const valid = {
  openingSlug: "grower",
  fullName: "Ana Silva",
  email: "ANA@example.com",
  phone: "+5511999999999",
  countryCode: "br",
  consentPrivacy: true,
  heardFrom: "linkedin",
  locale: "pt-BR",
  startedAt: 1000,
  website: "",
  cv: { name: "cv.pdf", mime: "application/pdf", size: 1234 },
};

function errors(raw: unknown) {
  const r = parsePublicApplication(raw);
  return r.ok ? [] : r.errors;
}

describe("parsePublicApplication", () => {
  it("accepts a valid payload and normalizes", () => {
    const r = parsePublicApplication(valid);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.application.email).toBe("ana@example.com");
    expect(r.value.application.countryCode).toBe("BR");
    expect(r.value.application.sourceDetail).toBe("linkedin");
    expect(r.value.locale).toBe("pt-BR");
    expect(r.value.openingSlug).toBe("grower");
  });

  it("ignores pipeline and internal fields", () => {
    const r = parsePublicApplication({
      ...valid,
      status: "hired",
      rating: 5,
      source: "manual",
      extra: { x: 1 },
      tags: ["vip"],
      openingId: "123e4567-e89b-42d3-a456-426614174000",
      createdBy: "u",
      cvPath: "applications/x",
      assigneeId: "a",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const a = r.value.application;
    expect(a.status).toBe("new");
    expect(a.rating).toBeUndefined();
    expect(a.source).toBe("website");
    expect(a.extra).toEqual({});
    expect(a.tags).toEqual([]);
    expect(a.openingId).toBeNull();
    expect(a.createdBy).toBeUndefined();
    expect(a.cvPath).toBeUndefined();
    expect(a.assigneeId).toBeUndefined();
  });

  it("applies public rules", () => {
    expect(errors({ ...valid, phone: "", countryCode: "" })).toEqual(
      expect.arrayContaining(["phoneRequired", "countryRequired"])
    );
    expect(errors({ ...valid, cv: undefined })).toContain("cvRequired");
    expect(errors({ ...valid, cv: { ...valid.cv, mime: "image/png" } })).toContain("cvType");
    expect(errors({ ...valid, cv: { ...valid.cv, size: 99_000_000 } })).toContain("cvTooLarge");
    expect(errors({ ...valid, coverLetter: "a".repeat(5001) })).toContain("coverLetterTooLong");
    expect(errors({ ...valid, consentPrivacy: false })).toContain("consentRequired");
    expect(errors(null)).toContain("nameRequired");
  });

  it("talent pool has null slug", () => {
    const r = parsePublicApplication({ ...valid, openingSlug: null });
    expect(r.ok && r.value.openingSlug).toBeNull();
  });
});

describe("looksLikeBot", () => {
  it("flags honeypot and fast submits", () => {
    expect(looksLikeBot({ website: "x", startedAt: 0 }, 10_000)).toBe(true);
    expect(looksLikeBot({ website: "", startedAt: 9000 }, 10_000)).toBe(true);
    expect(looksLikeBot({ website: "", startedAt: 1000 }, 10_000)).toBe(false);
    expect(looksLikeBot({}, 10_000)).toBe(true);
  });
});
