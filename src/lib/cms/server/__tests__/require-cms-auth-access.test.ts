import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const ensure = vi.fn();
vi.mock("@/lib/cms/server/access-control.server", () => ({
  ensureAccessControlHydrated: ensure,
}));

describe("CMS auth access-control hydration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
