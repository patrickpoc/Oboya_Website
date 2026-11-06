import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  path.resolve(__dirname, "../../../../supabase/migrations/20261105_cms_profile_privilege_guard.sql"),
  "utf8"
);

/**
 * Honest note: these are STATIC text checks only. They do NOT execute the SQL or test behaviour; they
 * catch accidental deletion of key statements. Behaviour is verified by running
 * supabase/diagnostics/verify_cms_privilege_guard.sql against a test database.
 */
describe("cms profile privilege guard migration (static text checks)", () => {
  it("is written to be re-runnable", () => {
    expect(sql).toMatch(/create or replace function public\.cms_protect_profile_columns/);
    expect(sql).toMatch(/drop trigger if exists trg_cms_protect_profile_columns/);
    expect(sql).toMatch(/drop policy if exists "Users insert own profile"/);
    expect(sql).toMatch(/drop policy if exists "Admins manage all profiles"/);
  });

  it("covers insert, update and delete and returns OLD for delete", () => {
    expect(sql).toMatch(/before insert or update or delete on public\.cms_user_profiles/);
    expect(sql).toMatch(/TG_OP = 'DELETE' then\s+return OLD;/);
  });

  it("raises instead of silently reverting", () => {
    expect(sql).not.toMatch(/NEW\.(role|status|permission_overrides) := OLD\./);
    expect(sql).toContain("errcode = '42501'");
  });

  it("has restrictive policies for the protected documents", () => {
    for (const op of ["insert", "update", "delete"]) {
      expect(sql).toContain(`"Super admin only protected docs ${op}"`);
      expect(sql).toMatch(new RegExp(`as restrictive for ${op}`));
    }
    expect(sql).toContain("'cms-access-control', 'cms-approval-policies'");
  });

  it("requires empty overrides on self-insert and keeps audit history", () => {
    expect(sql).toContain("permission_overrides = '{}'::jsonb");
    expect(sql).toMatch(/on delete set null/);
  });

  it("freezes own role/status for everyone and drops the unused bootstrap function", () => {
    expect(sql).not.toMatch(/and not caller_admin then\s+raise exception 'You cannot change your own/);
    expect(sql).toMatch(/drop function if exists public\.ensure_cms_super_admin\(\)/);
  });

  it("runs in one transaction with a lock timeout", () => {
    expect(sql).toMatch(/^begin;/m);
    expect(sql).toMatch(/set local lock_timeout = '5s'/);
    expect(sql.trimEnd()).toMatch(/commit;$/);
  });

  it("never disables RLS", () => {
    expect(sql.toLowerCase()).not.toContain("disable row level security");
  });
});
