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

  it("drops bad access-control rows (and logs) instead of failing the whole document", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { readAccessControlStrict } = await import("@/lib/cms/server/access-control.server");
    for (const bad of [
      { roles: [null], matrix: {} },
      { roles: [{ label: "no id" }], matrix: {} },
      { roles: [], matrix: { editor: "full" } },
      { roles: [], matrix: { editor: [] } },
    ]) {
      result = published(bad);
      const doc = await readAccessControlStrict();
      expect(doc.roles.every((r) => typeof r.id === "string")).toBe(true);
      expect(doc.matrix.editor).not.toBe("full");
      expect(doc.matrix.editor).not.toEqual([]);
    }
  });

  it("a dropped system-role row is deny-all, except super_admin which stays full", async () => {
    const { readAccessControlStrict } = await import("@/lib/cms/server/access-control.server");
    const { CMS_MODULES } = await import("@/lib/cms/permissions/access-types");
    result = published({ roles: [], matrix: { content_manager: "full", super_admin: [] } });
    const doc = await readAccessControlStrict();
    expect(CMS_MODULES.every((m) => doc.matrix.content_manager?.[m] === "none")).toBe(true);
    expect(CMS_MODULES.every((m) => doc.matrix.super_admin?.[m] === "full")).toBe(true);
    // A system role that is simply absent still gets its default row.
    expect(Object.keys(doc.matrix.viewer ?? {}).length).toBeGreaterThan(0);
    expect(doc.matrix.viewer?.dashboard).not.toBe("none");
  });

  it("unreadable cells in a non-super row become none and the read still succeeds", async () => {
    const { readAccessControlStrict } = await import("@/lib/cms/server/access-control.server");
    result = published({
      roles: [],
      matrix: { editor: { blog: "viewedit", media: 5, website: ["view", "bogus"], forms: "full" } },
    });
    const doc = await readAccessControlStrict();
    expect(doc.matrix.editor).toEqual({ blog: "none", media: "none", website: ["view"], forms: "full" });
  });

  it("rejects bad elements in policy documents", async () => {
    hydrateAccessControl.mockClear();
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
