import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// --- users -----------------------------------------------------------------
const deleteUser = vi.fn();
const updateUserById = vi.fn();
const profileDelete = vi.fn();
const profileUpdate = vi.fn();
const deleteCmsUser = vi.fn();
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => true }));
vi.mock("@/lib/supabase/admin", () => ({
  isServiceRoleConfigured: () => true,
  createServiceClient: () => ({
    auth: { admin: { deleteUser, updateUserById } },
    from: () => ({ delete: () => ({ eq: profileDelete }), update: (v: unknown) => ({ eq: (...a: unknown[]) => ({ select: () => profileUpdate(v, ...a) }) }) }),
  }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/cms/repositories/users-repository", () => ({
  deleteCmsUser,
  getCmsUserById: vi.fn(),
  getCmsUsers: () => [],
  saveCmsUser: vi.fn(),
}));

describe("deleteCmsUserDurable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteUser.mockResolvedValue({ error: null });
    profileDelete.mockResolvedValue({ error: null });
    profileUpdate.mockResolvedValue({ data: [{ id: "u1" }], error: null });
    updateUserById.mockResolvedValue({ error: null });
  });

  it("deactivates the profile and keeps it when the auth delete fails", async () => {
    deleteUser.mockResolvedValue({ error: { message: "fk violation" } });
    const { deleteCmsUserDurable } = await import("@/lib/cms/server/users.server");
    await expect(deleteCmsUserDurable("u1")).rejects.toMatchObject({ code: "revoked", message: "fk violation" });
    expect(profileUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: "inactive" }), "id", "u1");
    expect(updateUserById).toHaveBeenCalledWith("u1", { ban_duration: "876600h" });
    expect(profileDelete).not.toHaveBeenCalled();
    expect(deleteCmsUser).not.toHaveBeenCalled();
  });

  it("reports revocation_failed when the deactivation also fails", async () => {
    deleteUser.mockResolvedValue({ error: { message: "fk violation" } });
    profileUpdate.mockResolvedValue({ data: null, error: { message: "rls" } });
    updateUserById.mockResolvedValue({ error: { message: "ban failed" } });
    const { deleteCmsUserDurable } = await import("@/lib/cms/server/users.server");
    await expect(deleteCmsUserDurable("u1")).rejects.toMatchObject({ code: "revocation_failed" });
    expect(deleteCmsUser).not.toHaveBeenCalled();
  });

  it("is revoked when only the ban worked, and revocation_failed when the update matched 0 rows and no ban", async () => {
    deleteUser.mockResolvedValue({ error: { message: "fk violation" } });
    profileUpdate.mockResolvedValue({ data: [], error: null });
    const { deleteCmsUserDurable } = await import("@/lib/cms/server/users.server");
    await expect(deleteCmsUserDurable("u1")).rejects.toMatchObject({ code: "revoked" });
    updateUserById.mockResolvedValue({ error: { message: "ban failed" } });
    await expect(deleteCmsUserDurable("u1")).rejects.toMatchObject({ code: "revocation_failed" });
  });

  it("does not treat a bare 404 as user not found", async () => {
    deleteUser.mockResolvedValue({ error: { message: "route missing", status: 404 } });
    const { deleteCmsUserDurable } = await import("@/lib/cms/server/users.server");
    await expect(deleteCmsUserDurable("u1")).rejects.toMatchObject({ code: "revoked" });
    expect(profileDelete).not.toHaveBeenCalled();
  });

  it("treats auth user not found as success and finishes the profile and memory delete", async () => {
    deleteUser.mockResolvedValue({ error: { message: "User not found", code: "user_not_found" } });
    const { deleteCmsUserDurable } = await import("@/lib/cms/server/users.server");
    await expect(deleteCmsUserDurable("u1")).resolves.toBeUndefined();
    expect(profileUpdate).not.toHaveBeenCalled();
    expect(profileDelete).toHaveBeenCalled();
    expect(deleteCmsUser).toHaveBeenCalledWith("u1");
  });

  it("surfaces a profile delete error", async () => {
    profileDelete.mockResolvedValue({ error: { message: "rls" } });
    const { deleteCmsUserDurable } = await import("@/lib/cms/server/users.server");
    await expect(deleteCmsUserDurable("u1")).rejects.toThrow("rls");
    expect(deleteCmsUser).not.toHaveBeenCalled();
  });

  it("deletes auth first, then the profile, then memory", async () => {
    const order: string[] = [];
    deleteUser.mockImplementation(async () => (order.push("auth"), { error: null }));
    profileDelete.mockImplementation(async () => (order.push("profile"), { error: null }));
    deleteCmsUser.mockImplementation(() => order.push("memory"));
    const { deleteCmsUserDurable } = await import("@/lib/cms/server/users.server");
    await deleteCmsUserDurable("u1");
    expect(order).toEqual(["auth", "profile", "memory"]);
  });
});

// --- careers ---------------------------------------------------------------
const removeAllCvObjects = vi.fn();
const rowDelete = vi.fn();
vi.mock("@/lib/cms/server/careers-cv.server", () => ({
  removeAllCvObjects,
  removeCvObject: vi.fn(),
}));
vi.mock("@/lib/cms/server/careers-core.server", () => {
  class CareersError extends Error {
    constructor(public status: number, message: string) {
      super(message);
    }
  }
  return {
    CareersError,
    UUID_RE: /./,
    orNull: (v: unknown) => v ?? null,
    readLocalJson: async () => ({}),
    writeLocalJson: vi.fn(),
    throwIfDbError: (e: { message: string } | null) => {
      if (e) throw new CareersError(500, e.message);
    },
    careersClient: () => ({
      from: (table: string) => ({
        delete: () => ({ eq: rowDelete }),
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { id: "a1", extra: {} }, error: null }),
          }),
        }),
        table,
      }),
    }),
  };
});

describe("deleteApplication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rowDelete.mockResolvedValue({ error: null });
    removeAllCvObjects.mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  async function run() {
    const mod = await import("@/lib/cms/server/careers-applications.server");
    vi.spyOn(mod, "getApplication").mockResolvedValue({ id: "a1" } as never);
    return mod.deleteApplication("a1");
  }

  it("keeps the row when CV removal fails so the purge can retry", async () => {
    removeAllCvObjects.mockRejectedValue(new Error("storage"));
    await expect(run()).rejects.toThrow("storage");
    expect(rowDelete).not.toHaveBeenCalled();
  });

  it("removes the CVs before the row and surfaces a row delete failure", async () => {
    rowDelete.mockResolvedValue({ error: { message: "db" } });
    await expect(run()).rejects.toThrow();
    expect(removeAllCvObjects).toHaveBeenCalledWith("a1");
  });

  it("resolves when both steps succeed", async () => {
    await expect(run()).resolves.toBeUndefined();
    expect(removeAllCvObjects.mock.invocationCallOrder[0]).toBeLessThan(rowDelete.mock.invocationCallOrder[0]);
  });
});
