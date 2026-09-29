import { describe, expect, it } from "vitest";
import type { FormSubmission } from "@/lib/cms/types";
import {
  countByStatus,
  isUnread,
  leadName,
  leadSlaState,
  maskEmail,
  matchesLeadFilters,
  normalizeSubmissionStatus,
  normalizeTags,
  submissionsToCsv,
} from "@/lib/cms/forms/crm";

function lead(overrides: Partial<FormSubmission> = {}): FormSubmission {
  return {
    id: "a",
    type: "contact",
    status: "new",
    data: { firstName: "Ana", lastName: "Costa", email: "Ana@Greenhouse.nl", subject: "partnership" },
    createdAt: "2026-09-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("lead CRM helpers", () => {
  it("maps legacy read to in_progress and unknown values to new", () => {
    expect(normalizeSubmissionStatus("read")).toBe("in_progress");
    expect(normalizeSubmissionStatus("converted")).toBe("converted");
    expect(normalizeSubmissionStatus("bogus")).toBe("new");
  });

  it("normalizes tags (trim, lowercase, dedupe)", () => {
    expect(normalizeTags([" VIP ", "vip", "", "Distributor"])).toEqual(["vip", "distributor"]);
    expect(normalizeTags("x")).toEqual([]);
  });

  it("treats new leads without read_at as unread", () => {
    expect(isUnread(lead())).toBe(true);
    expect(isUnread(lead({ readAt: "2026-09-01T11:00:00.000Z" }))).toBe(false);
    expect(isUnread(lead({ status: "in_progress" }))).toBe(false);
  });

  it("flags SLA only for new leads past the thresholds", () => {
    const created = new Date("2026-09-01T10:00:00.000Z").getTime();
    expect(leadSlaState(lead(), created + 2 * 36e5)).toBe("ok");
    expect(leadSlaState(lead(), created + 30 * 36e5)).toBe("warning");
    expect(leadSlaState(lead(), created + 50 * 36e5)).toBe("overdue");
    expect(leadSlaState(lead({ status: "replied" }), created + 50 * 36e5)).toBe("ok");
  });

  it("derives names across contact and quote payloads", () => {
    expect(leadName(lead())).toBe("Ana Costa");
    expect(leadName(lead({ type: "quote", data: { contactName: "Luis", company: "Berry" } }))).toBe("Luis");
  });

  it("masks e-mails keeping the domain", () => {
    expect(maskEmail("procurement@berry.mx")).toBe("pr•••••@berry.mx");
  });

  it("exports CSV and can mask PII", () => {
    const masked = submissionsToCsv(
      [lead({ data: { firstName: "Ana", lastName: "Costa", email: "ana@greenhouse.nl", message: 'hello, "world"' } })],
      { maskPii: true }
    );
    expect(masked).toContain("an•@greenhouse.nl");
    expect(masked).not.toContain("hello");
    const full = submissionsToCsv(
      [lead({ data: { firstName: "Ana", lastName: "Costa", email: "ana@greenhouse.nl", message: 'hello, "world"' } })],
      { maskPii: false }
    );
    expect(full).toContain("ana@greenhouse.nl");
    expect(full).toContain('"hello, ""world"""');
  });

  it("filters by status buckets, assignee, tag and text", () => {
    const rows = [
      lead({ id: "1" }),
      lead({ id: "2", status: "in_progress", assigneeId: "u1", tags: ["vip"] }),
      lead({ id: "3", status: "archived" }),
    ];
    const ids = (f: Parameters<typeof matchesLeadFilters>[1]) =>
      rows.filter((r) => matchesLeadFilters(r, f)).map((r) => r.id);
    expect(ids({ status: "open" })).toEqual(["1", "2"]);
    expect(ids({ status: "unread" })).toEqual(["1"]);
    expect(ids({ assignee: "none" })).toEqual(["1", "3"]);
    expect(ids({ tag: "vip" })).toEqual(["2"]);
    expect(ids({ q: "greenhouse" })).toEqual(["1", "2", "3"]);
    expect(countByStatus(rows)).toMatchObject({ all: 3, open: 2, unread: 1, archived: 1 });
  });
});
