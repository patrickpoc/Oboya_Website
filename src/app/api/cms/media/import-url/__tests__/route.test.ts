import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

let guard: unknown = { user: { id: "u1" } };
const cmsGuardAny = vi.fn(async (..._args: unknown[]) => guard);
vi.mock("@/lib/cms/server/require-cms-auth", () => ({ cmsGuardAny }));

let supabase = true;
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => supabase }));
const storeMediaViaSupabaseServer = vi.fn(async (input: { tags?: string[]; folder?: string; file: File }) => ({
  id: "asset-1",
  url: "https://proj.supabase.co/storage/v1/object/public/cms-media/uploads/media-1.png",
  name: input.file.name,
  tags: input.tags,
  folder: input.folder,
}));
const storeMediaLocally = vi.fn(async () => ({ id: "local-1", url: "/uploads/media-1.png" }));
// Minimal query builder: `existing` answers the by-source lookup, `recentCount` the brake count.
let existing: unknown[] = [];
let recentCount = 0;
const queries: Array<{ tags: unknown; head: boolean }> = [];
const mediaSupabase = vi.fn(async () => ({
  from: () => ({
    select: (_cols: string, opts?: { head?: boolean }) => {
      const query = { tags: undefined as unknown, head: Boolean(opts?.head) };
      queries.push(query);
      const chain = {
        contains: (_c: string, value: unknown) => {
          query.tags = value;
          return chain;
        },
        gte: async () => ({ count: recentCount, error: null }),
        limit: async () => ({ data: existing, error: null }),
      };
      return chain;
    },
  }),
}));
vi.mock("@/lib/cms/server/media-upload.server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/cms/server/media-upload.server")>()),
  mediaSupabase,
  storeMediaViaSupabaseServer,
  storeMediaLocally,
}));
vi.mock("@/lib/cms/server/media-library.server", () => ({
  rowToAsset: (row: { id: string; url: string }) => ({ id: row.id, url: row.url }),
}));

// Only the network edge is replaced; the SSRF guard's own checks run for real in the 422 cases.
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(16)]);
vi.mock("@/lib/security/safe-remote-image", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/security/safe-remote-image")>();
  return {
    ...actual,
    fetchRemoteImage: (url: string) =>
      url === "https://cdn.example.com/ok.png"
        ? Promise.resolve({ buffer: PNG, mime: "image/png", finalUrl: url })
        : actual.fetchRemoteImage(url),
  };
});

const post = async (body: unknown, raw = false) => {
  const { POST } = await import("../route");
  return POST(
    new Request("http://x/api/cms/media/import-url", { method: "POST", body: raw ? (body as string) : JSON.stringify(body) })
  );
};

describe("POST /api/cms/media/import-url", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    guard = { user: { id: "u1" } };
    supabase = true;
    existing = [];
    recentCount = 0;
    queries.length = 0;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("requires a media or marketplace create permission", async () => {
    guard = { response: Response.json({ error: "Forbidden" }, { status: 403 }) };
    expect((await post({ url: "https://cdn.example.com/ok.png" })).status).toBe(403);
    expect(cmsGuardAny).toHaveBeenCalledWith([
      { module: "media", action: "create" },
      { module: "marketplace", action: "create" },
    ]);
    expect(storeMediaViaSupabaseServer).not.toHaveBeenCalled();
  });

  it("rejects a malformed or missing url with 400", async () => {
    expect((await post("{nope", true)).status).toBe(400);
    expect((await post({})).status).toBe(400);
    expect((await post({ url: 5 })).status).toBe(400);
    expect((await post({ url: `https://x.example.com/${"a".repeat(2100)}` })).status).toBe(400);
  });

  it.each([
    "http://cdn.example.com/a.png",
    "https://127.0.0.1/a.png",
    "https://169.254.169.254/latest/meta-data/",
    "https://[::1]/a.png",
    "https://localhost/a.png",
    "https://user:pw@cdn.example.com/a.png",
    "https://cdn.example.com:8443/a.png",
    "file:///etc/passwd",
  ])("refuses %s with 422 and stores nothing", async (url) => {
    const res = await post({ url });
    expect(res.status).toBe(422);
    expect(typeof ((await res.json()) as { error: string }).error).toBe("string");
    expect(storeMediaViaSupabaseServer).not.toHaveBeenCalled();
    expect(storeMediaLocally).not.toHaveBeenCalled();
  });

  it("stores a good image in Ecovaso Products, tagged so a test import can be found", async () => {
    const res = await post({ url: "https://cdn.example.com/ok.png" });
    expect(res.status).toBe(200);
    const call = storeMediaViaSupabaseServer.mock.calls[0]![0];
    expect(call.tags).toEqual(["upload", "imported-from-url", expect.stringMatching(/^src:[0-9a-f]{24}$/)]);
    expect(call.folder).toBe("folder-ecovaso-products");
    expect(call.file.type).toBe("image/png");
    expect(call.file.name).toBe("ok.png");
    expect(((await res.json()) as { asset: { url: string } }).asset.url).toMatch(/cms-media\/uploads\/media-/);
  });

  it("uses local storage when Supabase is not configured", async () => {
    supabase = false;
    expect((await post({ url: "https://cdn.example.com/ok.png" })).status).toBe(200);
    expect(storeMediaLocally).toHaveBeenCalledTimes(1);
    expect(storeMediaViaSupabaseServer).not.toHaveBeenCalled();
  });

  it("reuses the asset already imported from the same source URL, without fetching", async () => {
    existing = [{ id: "asset-0", url: "https://proj.supabase.co/storage/v1/object/public/cms-media/uploads/media-0.png" }];
    const res = await post({ url: "https://cdn.example.com/ok.png" });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { asset: { id: string; reused: boolean } }).asset).toMatchObject({
      id: "asset-0",
      reused: true,
    });
    expect(storeMediaViaSupabaseServer).not.toHaveBeenCalled();
  });

  it("answers 429 when too many images were imported in the last hour", async () => {
    recentCount = 300;
    const res = await post({ url: "https://cdn.example.com/ok.png" });
    expect(res.status).toBe(429);
    expect(storeMediaViaSupabaseServer).not.toHaveBeenCalled();
  });

  it("maps an undecodable image to 422", async () => {
    const { MediaImageError } = await import("@/lib/cms/server/media-upload.server");
    storeMediaViaSupabaseServer.mockRejectedValueOnce(new MediaImageError());
    expect((await post({ url: "https://cdn.example.com/ok.png" })).status).toBe(422);
  });
});
