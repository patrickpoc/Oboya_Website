import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const ensure = vi.fn();
vi.mock("@/lib/cms/server/access-control.server", () => ({
  ensureAccessControlHydrated: ensure,
}));

// A signed-in non-super-admin; a super admin is let through by design (see the integration test).
const profile = {
  id: "u1",
  role: "admin",
  status: "active",
  name: "A",
  locale: "en",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};
const client = {
  auth: { getUser: async () => ({ data: { user: { id: "u1", email: "a@example.test" } } }) },
  from: () => {
    const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: profile, error: null }) };
    return q;
  },
};
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => client }));

describe("CMS auth access-control hydration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("hydrates once and fails closed with 503 when the matrix is unreadable", async () => {
    ensure.mockRejectedValue(new Error("db"));
    const { requireCmsSession } = await import("../require-cms-auth");
    const result = await requireCmsSession();
    expect(ensure).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ ok: false, status: 503 });
  });

  it("does not return 503 when hydration succeeds", async () => {
    ensure.mockResolvedValue({ roles: [], matrix: {} });
    const { requireCmsSession } = await import("../require-cms-auth");
    const result = await requireCmsSession();
    expect(ensure).toHaveBeenCalledTimes(1);
    expect(result).not.toMatchObject({ status: 503 });
  });
});
