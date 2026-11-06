import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => true }));
let result: { data: unknown; error: { message: string } | null };
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => result }) }) }),
  }),
}));
const readCmsDocumentData = vi.fn(async () => null);
vi.mock("@/lib/cms/server/cms-document.server", () => ({
  cmsDocumentFilePath: () => "",
  readCmsDocumentSeedFile: async () => null,
  readCmsDocumentData,
  writeCmsDocumentData: vi.fn(),
}));
const hydrateAccessControl = vi.fn();
let snapshot: { hydrated: boolean; roles?: unknown[]; matrix?: object } = { hydrated: false };
vi.mock("@/lib/cms/permissions/access-store", () => ({
  hydrateAccessControl,
  getAccessSnapshot: () => snapshot,
}));

describe("access control and policies strict reads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    snapshot = { hydrated: false };
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("a failed access-control read does not hydrate defaults", async () => {
    result = { data: null, error: { message: "db" } };
    const { readAccessControlStrict } = await import("@/lib/cms/server/access-control.server");
    await expect(readAccessControlStrict()).rejects.toThrow();
    expect(hydrateAccessControl).not.toHaveBeenCalled();
  });

  it("an absent access-control row hydrates defaults; a stored one is used", async () => {
    result = { data: null, error: null };
    const { readAccessControlStrict } = await import("@/lib/cms/server/access-control.server");
    await readAccessControlStrict();
    expect(hydrateAccessControl).toHaveBeenCalledTimes(1);
  });

  it("a failed policies read throws and keeps the cache untouched", async () => {
    const { readApprovalPoliciesStrict, readApprovalPoliciesDurable } = await import(
      "@/lib/cms/server/approval-policies.server"
    );
    result = { data: null, error: { message: "db" } };
    await expect(readApprovalPoliciesStrict()).rejects.toThrow();
    // Cache stayed empty, so the tolerant read still goes to the (mocked) source.
    await readApprovalPoliciesDurable();
    expect(readCmsDocumentData).toHaveBeenCalledTimes(1);
  });

  it("an absent policies row yields defaults", async () => {
    const { readApprovalPoliciesStrict } = await import("@/lib/cms/server/approval-policies.server");
    result = { data: null, error: null };
    expect((await readApprovalPoliciesStrict()).policies.length).toBeGreaterThan(0);
  });

  const published = (data: unknown) => ({ data: { data, status: "published" }, error: null });

  it("malformed access-control documents throw and never hydrate", async () => {
    const { readAccessControlStrict } = await import("@/lib/cms/server/access-control.server");
    for (const bad of [{ roles: "x", matrix: {} }, { roles: [], matrix: [] }, { roles: [] }, []]) {
      result = published(bad);
      await expect(readAccessControlStrict()).rejects.toThrow();
    }
    expect(hydrateAccessControl).not.toHaveBeenCalled();
  });

  it("plain read: failed read keeps the snapshot, and fails closed on a cold start", async () => {
    const { readAccessControlDurable } = await import("@/lib/cms/server/access-control.server");
    result = { data: null, error: { message: "db" } };
    await expect(readAccessControlDurable()).rejects.toThrow();
    snapshot = { hydrated: true, roles: [{ id: "x" }], matrix: { x: {} } };
    await expect(readAccessControlDurable()).resolves.toEqual({ roles: [{ id: "x" }], matrix: { x: {} } });
    expect(hydrateAccessControl).not.toHaveBeenCalled();
  });

  it("rejects bad elements in access-control and policy documents", async () => {
    const { readAccessControlStrict } = await import("@/lib/cms/server/access-control.server");
    for (const bad of [
      { roles: [null], matrix: {} },
      { roles: [{ label: "no id" }], matrix: {} },
      { roles: [], matrix: { editor: "full" } },
      { roles: [], matrix: { editor: [] } },
    ]) {
      result = published(bad);
      await expect(readAccessControlStrict()).rejects.toThrow();
    }
    const { readApprovalPoliciesStrict } = await import("@/lib/cms/server/approval-policies.server");
    for (const bad of [{ policies: [null] }, { policies: [{ requiresApproval: true }] }]) {
      result = published(bad);
      await expect(readApprovalPoliciesStrict()).rejects.toThrow();
    }
    expect(hydrateAccessControl).not.toHaveBeenCalled();
  });

  it("a malformed policies document throws and keeps the cache untouched", async () => {
    vi.resetModules(); // fresh module-level cache
    const { readApprovalPoliciesStrict, readApprovalPoliciesDurable } = await import(
      "@/lib/cms/server/approval-policies.server"
    );
    result = published({ policies: {} });
    await expect(readApprovalPoliciesStrict()).rejects.toThrow();
    await readApprovalPoliciesDurable();
    expect(readCmsDocumentData).toHaveBeenCalledTimes(1);
  });

  it("a malformed checkout document (array) throws", async () => {
    const { readCheckoutPageStrict } = await import("@/lib/cms/server/checkout-page.server");
    result = published([]);
    await expect(readCheckoutPageStrict()).rejects.toThrow();
  });
});
