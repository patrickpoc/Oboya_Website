import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
let actor = { id: "a1", role: "admin" };
vi.mock("@/lib/cms/server/require-cms-auth", () => ({
  cmsGuard: async () => ({ user: actor }),
}));
const reset = vi.fn(async () => "new-password");
vi.mock("@/lib/cms/server/users.server", () => ({
  listCmsUsersDurable: async () => [
    { id: "u1", role: "editor" },
    { id: "s1", role: "super_admin" },
  ],
  resetCmsUserPasswordDurable: reset,
}));

const post = async (id: string) => {
  const { POST } = await import("../route");
  return POST(new Request("http://x", { method: "POST", body: "{}" }), {
    params: Promise.resolve({ id }),
  });
};

describe("POST /api/cms/users/[id]/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actor = { id: "a1", role: "admin" };
  });

  it("404s a missing user without resetting", async () => {
    expect((await post("nope")).status).toBe(404);
    expect(reset).not.toHaveBeenCalled();
  });

  it("403s a non-super admin targeting a super admin", async () => {
    expect((await post("s1")).status).toBe(403);
    expect(reset).not.toHaveBeenCalled();
  });

  it("lets a super admin reset a super admin and an admin reset a regular user", async () => {
    actor = { id: "a2", role: "super_admin" };
    expect((await post("s1")).status).toBe(200);
    actor = { id: "a1", role: "admin" };
    expect((await post("u1")).status).toBe(200);
  });
});
