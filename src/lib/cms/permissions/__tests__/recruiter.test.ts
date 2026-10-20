import { describe, expect, it, vi } from "vitest";
import { normalizeDoc } from "@/lib/cms/server/access-control.server";

vi.mock("server-only", () => ({}));
import { SYSTEM_ROLE_IDS } from "@/lib/cms/types";
import { CMS_MODULES } from "../access-types";
import { BUILTIN_MATRIX, buildDefaultAccessControlDoc, roleTier } from "../defaults";
import { canAccess } from "../access-resolve";

describe("recruiter role", () => {
  it("is a built-in analyst-tier role before viewer", () => {
    const ids = [...SYSTEM_ROLE_IDS];
    expect(ids).toContain("recruiter");
    expect(ids.indexOf("recruiter")).toBe(ids.indexOf("viewer") - 1);
    expect(roleTier("recruiter")).toBe("analyst");
  });

  it("can view/create/edit/publish careers but not delete", () => {
    for (const a of ["view", "create", "edit", "publish"] as const) {
      expect(canAccess("recruiter", "careers", a)).toBe(true);
    }
    expect(canAccess("recruiter", "careers", "delete")).toBe(false);
  });

  it("only sees dashboard and careers", () => {
    expect(canAccess("recruiter", "dashboard", "view")).toBe(true);
    for (const m of CMS_MODULES) {
      if (m === "dashboard" || m === "careers") continue;
      expect(canAccess("recruiter", m, "view")).toBe(false);
    }
    expect(BUILTIN_MATRIX.recruiter.forms).toBe("none");
  });

  it("default doc includes recruiter role and matrix row", () => {
    const doc = buildDefaultAccessControlDoc();
    expect(doc.roles.some((r) => r.id === "recruiter" && r.system)).toBe(true);
    expect(doc.matrix.recruiter.careers).toEqual(["view", "create", "edit", "publish"]);
  });

  it("normalizing an old stored doc without recruiter adds role and matrix row", () => {
    const old = buildDefaultAccessControlDoc();
    old.roles = old.roles.filter((r) => r.id !== "recruiter");
    delete old.matrix.recruiter;
    const doc = normalizeDoc(old);
    expect(doc.roles.some((r) => r.id === "recruiter" && r.system)).toBe(true);
    expect(doc.matrix.recruiter.careers).toEqual(["view", "create", "edit", "publish"]);
  });
});
