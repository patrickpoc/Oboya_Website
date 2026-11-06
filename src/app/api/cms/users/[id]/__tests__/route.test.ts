import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/cms/server/require-cms-auth", () => ({
  cmsGuard: async () => ({ user: { id: "admin", role: "super_admin" } }),
}));
const deleteCmsUserDurable = vi.fn();
class UserDeleteError extends Error {
  constructor(public code: string, detail: string) {
    super(detail);
  }
}
vi.mock("@/lib/cms/server/users.server", () => ({
  UserDeleteError,
  deleteCmsUserDurable,
  listCmsUsersDurable: async () => [{ id: "u1", role: "editor", status: "active" }],
  updateCmsUserDurable: vi.fn(),
}));

const del = async () => {
  const { DELETE } = await import("../route");
  return DELETE(new Request("http://x/api/cms/users/u1", { method: "DELETE" }), {
    params: Promise.resolve({ id: "u1" }),
  });
};

describe("DELETE /api/cms/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("tells the operator access was revoked but the account remains", async () => {
    deleteCmsUserDurable.mockRejectedValue(new UserDeleteError("revoked", "fk secret"));
    const res = await del();
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.code).toBe("revoked");
    expect(body.error).toMatch(/revoked/i);
    expect(JSON.stringify(body)).not.toContain("secret");
  });

  it("tells the operator revocation also failed", async () => {
    deleteCmsUserDurable.mockRejectedValue(new UserDeleteError("revocation_failed", "x"));
    const body = await (await del()).json();
    expect(body.code).toBe("revocation_failed");
    expect(body.error).toMatch(/could not be revoked/i);
  });

  it("returns 404 for an unknown user without deleting", async () => {
    const { DELETE } = await import("../route");
    const res = await DELETE(new Request("http://x/api/cms/users/zz", { method: "DELETE" }), {
      params: Promise.resolve({ id: "zz" }),
    });
    expect(res.status).toBe(404);
    expect(deleteCmsUserDurable).not.toHaveBeenCalled();
  });

  it("returns the generic error for anything else", async () => {
    deleteCmsUserDurable.mockRejectedValue(new Error("boom"));
    expect((await (await del()).json()).error).toBe("Failed to delete user");
  });
});
