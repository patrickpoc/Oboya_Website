import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Admin access through the REAL auth and access-control path. Only the Supabase
 * client factory is faked: require-cms-auth, access-control, strict-read,
 * cms-document, the permission matrix and the route handlers all run for real.
 */
vi.mock("server-only", () => ({}));

const UID = "11111111-1111-1111-1111-111111111111";
type Doc = { data: unknown; status: string };
const db: { docs: Record<string, Doc>; profile: Record<string, unknown> | null; anon: boolean } = {
  docs: {},
  profile: null,
  anon: false,
};

function query(table: string) {
  const filters: Array<[string, unknown]> = [];
  const run = () => {
    let rows: Array<Record<string, unknown>> = [];
    if (table === "cms_documents") {
      rows = Object.entries(db.docs).map(([id, d]) => ({ id, ...d }));
    } else if (table === "cms_user_profiles") {
      rows = db.profile ? [db.profile] : [];
    }
    for (const [k, v] of filters) rows = rows.filter((r) => r[k] === v);
    return { data: rows[0] ?? null, error: null };
  };
  const q = {
    select: () => q,
    eq: (k: string, v: unknown) => {
      filters.push([k, v]);
      return q;
    },
    maybeSingle: async () => run(),
  };
  return q;
}
const client = {
  from: query,
  auth: {
    getUser: async () => ({
      data: { user: db.anon ? null : { id: UID, email: "a@example.test" } },
    }),
  },
};
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => client,
  createPublicClient: () => client,
}));

const published = (data: unknown): Doc => ({ data, status: "published" });

async function setup(opts: { role: string; doc?: Doc | null }) {
  vi.resetModules();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://supabase.test";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const { buildDefaultAccessControlDoc } = await import("@/lib/cms/permissions/defaults");
  db.anon = false;
  db.docs = {};
  const doc = opts.doc === undefined ? published(buildDefaultAccessControlDoc()) : opts.doc;
  if (doc) db.docs["cms-access-control"] = doc;
  db.profile = {
    id: UID,
    role: opts.role,
    status: "active",
    name: "A",
    locale: "en",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
  const auth = await import("@/lib/cms/server/require-cms-auth");
  return {
    auth,
    base: buildDefaultAccessControlDoc() as unknown as {
      roles: unknown[];
      matrix: Record<string, unknown>;
    },
  };
}

describe("admin access through the real auth and access-control path", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("healthy document: admin passes, a role without the module is denied", async () => {
    const { auth } = await setup({ role: "admin" });
    expect(await auth.requireCmsAuth({ module: "marketplace", action: "edit" })).toMatchObject({ ok: true });
    const denied = await setup({ role: "viewer" });
    expect(await denied.auth.requireCmsAuth({ module: "users", action: "edit" })).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it("malformed rows are dropped, not an outage", async () => {
    const { base } = await setup({ role: "admin" });
    base.matrix.viewer = null; // system role: refilled with its default
    base.roles.push(null, { id: 7 }); // junk role entries
    const { auth } = await setup({ role: "admin", doc: published(base) });
    expect(await auth.requireCmsAuth({ module: "marketplace", action: "edit" })).toMatchObject({ ok: true });
    const logged = vi.mocked(console.error).mock.calls.flat().join(" ");
    expect(logged).toContain("dropped 2 bad role(s)");
  });

  it("a dropped custom-role row denies that role instead of failing everyone", async () => {
    const { base } = await setup({ role: "partner_x" });
    base.roles.push({ id: "partner_x", label: "Partner", system: false, active: true, sortOrder: 99 });
    base.matrix.partner_x = null;
    const { auth } = await setup({ role: "partner_x", doc: published(base) });
    expect(await auth.requireCmsAuth({ module: "marketplace", action: "view" })).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it("wrong top-level type: 503 for others, a super admin still gets in", async () => {
    const { base } = await setup({ role: "admin" });
    const broken = published({ ...base, roles: { not: "an array" } });
    const admin = await setup({ role: "admin", doc: broken });
    expect(await admin.auth.requireCmsAuth({ module: "marketplace" })).toMatchObject({ ok: false, status: 503 });
    const sa = await setup({ role: "super_admin", doc: broken });
    expect(await sa.auth.requireCmsAuth({ module: "users", action: "edit" })).toMatchObject({ ok: true });
  });

  it("non-published document on a cold start: 503 for others, super admin still gets in", async () => {
    const { base } = await setup({ role: "admin" });
    const draft: Doc = { data: base, status: "draft" };
    const admin = await setup({ role: "admin", doc: draft });
    expect(await admin.auth.requireCmsAuth({ module: "marketplace" })).toMatchObject({ ok: false, status: 503 });
    const sa = await setup({ role: "super_admin", doc: draft });
    expect(await sa.auth.requireCmsAuth({ module: "marketplace" })).toMatchObject({ ok: true });
  });

  it("an absent document falls back to the built-in defaults", async () => {
    const { auth } = await setup({ role: "admin", doc: null });
    expect(await auth.requireCmsAuth({ module: "marketplace", action: "edit" })).toMatchObject({ ok: true });
  });

  it("GET /api/cms/access-control serves the sanitized document through the real route", async () => {
    const { base } = await setup({ role: "super_admin" });
    base.matrix.viewer = null;
    await setup({ role: "super_admin", doc: published(base) });
    const { GET } = await import("@/app/api/cms/access-control/route");
    const res = await GET(new Request("http://x/api/cms/access-control?forEdit=1"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { matrix: Record<string, unknown> };
    expect(body.matrix.viewer).toBeTruthy();
  });

  it("PUT rejects a bad row with 400 and accepts nothing it would drop", async () => {
    const { base } = await setup({ role: "super_admin" });
    await setup({ role: "super_admin" });
    const { PUT } = await import("@/app/api/cms/access-control/route");
    const put = (body: unknown) =>
      PUT(new Request("http://x/api/cms/access-control", { method: "PUT", body: JSON.stringify(body) }));
    expect((await put({ ...base, matrix: { ...base.matrix, viewer: null } })).status).toBe(400);
    expect((await put({ ...base, roles: [...base.roles, null] })).status).toBe(400);
  });
});
