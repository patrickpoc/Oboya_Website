import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getPublicOpeningLive = vi.fn();
const createPublicApplication = vi.fn();
vi.mock("@/lib/cms/server/careers-public.server", () => ({ getPublicOpeningLive }));
vi.mock("@/lib/cms/server/careers-public-apply.server", () => ({ createPublicApplication }));
vi.mock("@/lib/security/rate-limit", () => ({ assertCareersApplyRateLimit: async () => ({ ok: true }) }));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => false }));
vi.mock("@/lib/supabase/admin", () => ({ isServiceRoleConfigured: () => false }));
vi.mock("@/lib/cms/server/approvals.server", () => ({ ApprovalError: class extends Error {}, approvalErrorResponse: vi.fn() }));
vi.mock("@/lib/cms/server/local-fs.server", () => ({ writeLocalJsonFile: vi.fn() }));

const valid = () => ({
  openingSlug: "sample",
  fullName: "Ana Silva",
  email: "ana@example.com",
  phone: "+5511999999999",
  countryCode: "BR",
  consentPrivacy: true,
  cv: { name: "cv.pdf", mime: "application/pdf", size: 1000 },
  website: "",
  startedAt: Date.now() - 10_000,
  locale: "en",
});

function req(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/careers/apply", {
    method: "POST",
    headers: { host: "localhost", origin: "http://localhost", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function post(r: Request) {
  const { POST } = await import("../route");
  return POST(r);
}

beforeEach(() => {
  vi.clearAllMocks();
  getPublicOpeningLive.mockResolvedValue({ id: "o1", slug: "sample" });
  createPublicApplication.mockResolvedValue({ applicationId: "a", uploadUrl: "u", path: "p", ticket: "t" });
});

describe("POST /api/careers/apply", () => {
  it("creates the application", async () => {
    const res = await post(req(valid()));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ applicationId: "a", ticket: "t" });
    expect(res.headers.get("cache-control")).toContain("no-store");
  });

  it("rejects a foreign or missing Origin", async () => {
    expect((await post(req(valid(), { origin: "https://evil.example" }))).status).toBe(403);
    const noOrigin = new Request("http://localhost/api/careers/apply", { method: "POST", body: "{}" });
    expect((await post(noOrigin)).status).toBe(403);
    expect(createPublicApplication).not.toHaveBeenCalled();
  });

  it("rejects bodies over 32 KB", async () => {
    const res = await post(req({ ...valid(), coverLetter: "x".repeat(40_000) }));
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: "payloadTooLarge" });
  });

  it("returns 404 for an unpublished slug", async () => {
    getPublicOpeningLive.mockResolvedValue(null);
    const res = await post(req(valid()));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "openingClosed" });
  });

  it("honeypot and fast submits return 200 without a write", async () => {
    for (const body of [{ ...valid(), website: "http://spam" }, { ...valid(), startedAt: Date.now() }]) {
      const res = await post(req(body));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
    }
    expect(createPublicApplication).not.toHaveBeenCalled();
  });

  it("ignores injected pipeline fields", async () => {
    await post(req({ ...valid(), status: "hired", rating: 5, source: "manual", extra: { x: 1 } }));
    const app = createPublicApplication.mock.calls[0][0].application;
    expect(app).toMatchObject({ status: "new", source: "website", extra: {} });
    expect(app.rating).toBeUndefined();
  });

  it("never answers 409 (duplicates are accepted) and returns 400 for invalid fields", async () => {
    expect((await post(req(valid()))).status).toBe(200);
    expect((await post(req(valid()))).status).toBe(200);
    expect((await post(req({ ...valid(), email: "nope" }))).status).toBe(400);
  });
});
