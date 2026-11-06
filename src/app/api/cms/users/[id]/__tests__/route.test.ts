import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/cms/server/require-cms-auth", () => ({
  cmsGuard: async () => ({ user: { id: "admin", role: "super_admin" } }),
}));
const deleteCmsUserDurable = vi.fn();
const updateCmsUserDurable = vi.fn();
class UserDeleteError extends Error {
  constructor(public code: string, detail: string) {
    super(detail);
  }
}
vi.mock("@/lib/cms/server/users.server", () => ({
  UserDeleteError,
  deleteCmsUserDurable,
  listCmsUsersDurable: async () => [
    { id: "u1", role: "editor", status: "active" },
    { id: "admin", role: "super_admin", status: "active" },
    { id: "s2", role: "super_admin", status: "active" },
  ],
  updateCmsUserDurable,
}));

const del = async () => {
  const { DELETE } = await import("../route");
  return DELETE(new Request("http://x/api/cms/users/u1", { method: "DELETE" }), {
    params: Promise.resolve({ id: "u1" }),
  });
};

describe("PATCH /api/cms/users/[id]", () => {
  it.each([{}, [], 5, true])("rejects a non-string role %j with 400", async (role) => {
    const { PATCH } = await import("../route");
    const res = await PATCH(
      new Request("http://x/api/cms/users/u1", { method: "PATCH", body: JSON.stringify({ role }) }),
      { params: Promise.resolve({ id: "u1" }) }
    );
    expect(res.status).toBe(400);
    expect(updateCmsUserDurable).not.toHaveBeenCalled();
  });
});

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
    expect(body.error).toMatch(/deactivated/i);
    expect(body.error).not.toMatch(/try again|retry/i);
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

  it("blocks changing your own role but allows other fields", async () => {
    const { PATCH } = await import("../route");
    const patch = (body: unknown) =>
      PATCH(new Request("http://x/api/cms/users/admin", { method: "PATCH", body: JSON.stringify(body) }), {
        params: Promise.resolve({ id: "admin" }),
      });
    expect((await patch({ role: "viewer" })).status).toBe(403);
    expect(updateCmsUserDurable).not.toHaveBeenCalled();
    updateCmsUserDurable.mockResolvedValue({ id: "admin" });
    expect((await patch({ name: "New", role: "super_admin" })).status).toBe(200);
  });
});
