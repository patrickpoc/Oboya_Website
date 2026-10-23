import { describe, expect, it } from "vitest";
import { applyOpeningAction, duplicateOpening, nextOpeningStatus } from "@/lib/cms/careers/lifecycle";
import { normalizeOpening } from "@/lib/cms/careers/validation";

const base = normalizeOpening({ id: "1", title: { en: "Dev" }, slug: "dev" });

describe("opening lifecycle", () => {
  it("allows only valid transitions", () => {
    expect(nextOpeningStatus("publish", "draft")).toBe("published");
    expect(nextOpeningStatus("publish", "closed")).toBeNull();
    expect(nextOpeningStatus("close", "published")).toBe("closed");
    expect(nextOpeningStatus("close", "draft")).toBeNull();
    expect(nextOpeningStatus("reopen", "closed")).toBe("published");
    expect(nextOpeningStatus("archive", "archived")).toBeNull();
  });

  it("stamps published_at and closed_at", () => {
    const published = applyOpeningAction(base, "publish", "2026-10-01T00:00:00.000Z")!;
    expect(published.publishedAt).toBe("2026-10-01T00:00:00.000Z");
    const closed = applyOpeningAction(published, "close", "2026-10-02T00:00:00.000Z")!;
    expect(closed.status).toBe("closed");
    expect(closed.closedAt).toBe("2026-10-02T00:00:00.000Z");
    const reopened = applyOpeningAction(closed, "reopen", "2026-10-03T00:00:00.000Z")!;
    expect(reopened.status).toBe("published");
    expect(reopened.closedAt).toBeUndefined();
    expect(reopened.publishedAt).toBe("2026-10-01T00:00:00.000Z");
    expect(applyOpeningAction(base, "close")).toBeNull();
  });

  it("duplicates as draft with -copy slug and cleared dates", () => {
    const src = { ...base, status: "published" as const, publishedAt: "2026-10-01T00:00:00Z", publishAt: "2026-10-01T00:00:00Z" };
    const copy = duplicateOpening(src, "2");
    expect(copy.id).toBe("2");
    expect(copy.slug).toBe("dev-copy");
    expect(copy.status).toBe("draft");
    expect(copy.publishedAt).toBeUndefined();
    expect(copy.publishAt).toBeUndefined();
    expect(duplicateOpening(src, "3", ["dev-copy"]).slug).toBe("dev-copy-2");
  });
});
