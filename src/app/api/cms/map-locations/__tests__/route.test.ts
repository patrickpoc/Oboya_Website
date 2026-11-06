import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const raw = {
  viewBox: { width: 1, height: 1 },
  locations: [{ id: "x", offices: [{ id: "a", email: "s@x.com", showEmail: false }] }],
};
const cmsGuard = vi.fn();

vi.mock("@/lib/cms/server/require-cms-auth", () => ({ cmsGuard }));
const readStrict = vi.fn();
vi.mock("@/lib/map-locations.server", () => ({ readMapLocationsStrict: readStrict }));

describe("GET /api/cms/map-locations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readStrict.mockResolvedValue(raw);
  });

  it.each([401, 403])("returns %i when the guard fails", async (status) => {
    cmsGuard.mockResolvedValue({ response: Response.json({ error: "no" }, { status }) });
    const { GET } = await import("../route");
    expect((await GET()).status).toBe(status);
    expect(cmsGuard).toHaveBeenCalledWith("global_presence", "view");
  });

  it("returns unstripped data when authorized", async () => {
    cmsGuard.mockResolvedValue({ user: { id: "u1" } });
    const { GET } = await import("../route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(raw);
  });

  it("returns 503 instead of seed data when the strict read fails", async () => {
    cmsGuard.mockResolvedValue({ user: { id: "u1" } });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { CmsReadError } = await import("@/lib/cms/server/strict-read");
    readStrict.mockRejectedValue(new CmsReadError("db"));
    const { GET } = await import("../route");
    expect((await GET()).status).toBe(503);
  });
});
