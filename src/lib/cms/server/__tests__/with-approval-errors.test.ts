import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => true }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/cms/server/audit-logs.server", () => ({ addAuditLogDurable: vi.fn() }));
vi.mock("@/lib/cms/server/approval-policies.server", () => ({ readApprovalPoliciesDurable: vi.fn() }));
vi.mock("@/lib/cms/server/approval-appliers.server", () => ({ getApplier: vi.fn() }));

describe("withApprovalErrors", () => {
  const run = async (error: unknown) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { withApprovalErrors } = await import("@/lib/cms/server/approvals.server");
    return withApprovalErrors("Failed to save", async () => {
      throw error;
    })();
  };

  it("keeps the ApprovalError status and message", async () => {
    const { ApprovalError } = await import("@/lib/cms/server/approvals.server");
    const res = await run(new ApprovalError(409, "Closed"));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Closed" });
  });

  it("maps CmsReadError to 503", async () => {
    const { CmsReadError } = await import("@/lib/cms/server/strict-read");
    expect((await run(new CmsReadError("secret"))).status).toBe(503);
  });

  it("returns only the fallback for any other error", async () => {
    const res = await run(new Error("relation cms_documents secret"));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Failed to save" });
  });
});
