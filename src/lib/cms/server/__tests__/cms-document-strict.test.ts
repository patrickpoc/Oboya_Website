import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let configured = true;
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => configured }));

let result: { data: unknown; error: { message: string } | null };
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => result }) }),
    }),
  }),
}));

const readFile = vi.fn();
vi.mock("node:fs/promises", () => ({ readFile: (...a: unknown[]) => readFile(...a) }));

async function load() {
  return import("@/lib/cms/server/strict-read");
}

describe("readCmsDocumentStrict", () => {
  beforeEach(() => {
    configured = true;
    readFile.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns null only for a confirmed-absent row", async () => {
    result = { data: null, error: null };
    const { readCmsDocumentStrict } = await load();
    expect(await readCmsDocumentStrict("doc")).toBeNull();
  });

  it("returns published data", async () => {
    result = { data: { status: "published", data: { a: 1 } }, error: null };
    const { readCmsDocumentStrict } = await load();
    expect(await readCmsDocumentStrict("doc")).toEqual({ a: 1 });
  });

  it("throws CmsReadError on a read error without leaking its text", async () => {
    result = { data: null, error: { message: "secret db text" } };
    const { readCmsDocumentStrict, CmsReadError } = await load();
    const error: Error = await readCmsDocumentStrict("doc").catch((e: Error) => e) as Error;
    expect(error).toBeInstanceOf(CmsReadError);
    expect(error.message).not.toContain("secret");
  });

  it("throws when the row is not published", async () => {
    result = { data: { status: "draft", data: { a: 1 } }, error: null };
    const { readCmsDocumentStrict, CmsReadError } = await load();
    await expect(readCmsDocumentStrict("doc")).rejects.toBeInstanceOf(CmsReadError);
  });

  it("throws when data is null", async () => {
    result = { data: { status: "published", data: null }, error: null };
    const { readCmsDocumentStrict, CmsReadError } = await load();
    await expect(readCmsDocumentStrict("doc")).rejects.toBeInstanceOf(CmsReadError);
  });

  it("local: ENOENT is absent, bad JSON throws", async () => {
    configured = false;
    const { readCmsDocumentStrict, CmsReadError } = await load();
    readFile.mockRejectedValueOnce(Object.assign(new Error("x"), { code: "ENOENT" }));
    expect(await readCmsDocumentStrict("doc")).toBeNull();
    readFile.mockResolvedValueOnce("{nope");
    await expect(readCmsDocumentStrict("doc")).rejects.toBeInstanceOf(CmsReadError);
    readFile.mockRejectedValueOnce(Object.assign(new Error("x"), { code: "EACCES" }));
    await expect(readCmsDocumentStrict("doc")).rejects.toBeInstanceOf(CmsReadError);
  });

  it("maps CmsReadError to 503", async () => {
    const { readFailureResponse } = await load();
    const res = readFailureResponse();
    expect(res.status).toBe(503);
    expect(res.headers.get("cache-control")).toContain("no-store");
  });
});

describe("reviewChangeRequest with a failing baseline read", () => {
  it("rethrows CmsReadError and leaves the request open", async () => {
    vi.resetModules();
    const updateChangeRequest = vi.fn();
    const { CmsReadError } = await load();
    vi.doMock("@/lib/cms/server/change-requests.server", () => ({
      getChangeRequest: async () => ({
        id: "r1",
        status: "pending",
        changeType: "website.about",
        requestedBy: "maker",
      }),
      updateChangeRequest,
      insertChangeRequest: vi.fn(),
      listChangeRequests: vi.fn(),
    }));
    vi.doMock("@/lib/cms/server/approval-policies.server", () => ({
      readApprovalPoliciesDurable: async () => ({ policies: [] }),
    }));
    vi.doMock("@/lib/cms/approvals/policies", () => ({
      findPolicy: () => ({ requireRejectComment: false }),
      canReviewRequest: () => true,
      isPolicyApprover: () => true,
      policyRequiresApproval: () => true,
      reviewableChangeTypes: () => [],
    }));
    vi.doMock("@/lib/cms/server/audit-logs.server", () => ({ addAuditLogDurable: vi.fn() }));
    vi.doMock("@/lib/cms/server/approval-appliers.server", () => ({
      getApplier: async () => ({
        detectConflicts: async () => [],
        apply: async () => {
          throw new CmsReadError();
        },
      }),
    }));
    const { reviewChangeRequest } = await import("@/lib/cms/server/approvals.server");
    await expect(
      reviewChangeRequest({
        id: "r1",
        user: { id: "checker", name: "C" } as never,
        decision: "approve",
      })
    ).rejects.toBeInstanceOf(CmsReadError);
    expect(updateChangeRequest).not.toHaveBeenCalled();
  });
});
