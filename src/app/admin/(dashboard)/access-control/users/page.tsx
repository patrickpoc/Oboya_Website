"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ExternalLink, RotateCcw, Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { EditorGuard, FormSkeleton } from "@/components/admin/common";
import {
  UserOverridesEditor,
  countOverrides,
} from "@/components/admin/access-control/UserOverridesEditor";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AccessControlDoc } from "@/lib/cms/permissions/access-types";
import { ROLE_TIERS, roleTier, type RoleTier } from "@/lib/cms/permissions/defaults";
import { stableStringify } from "@/lib/cms/approvals/diff";
import type { CmsUser, PermissionOverrides } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

const TIER_AVATAR: Record<RoleTier, string> = {
  platform: "bg-oboya-blue-dark text-white",
  c_level: "bg-oboya-orange text-white",
  manager: "bg-oboya-green text-white",
  analyst: "bg-oboya-blue-light text-white",
  custom: "bg-oboya-yellow-dark text-white",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

async function fetchUsersAndAccess() {
  const [usersRes, accessRes] = await Promise.all([
    fetch("/api/cms/access-control/users", { cache: "no-store" }),
    fetch("/api/cms/access-control", { cache: "no-store" }),
  ]);
  const usersData = (await usersRes.json()) as { users?: CmsUser[]; error?: string };
  const accessData = (await accessRes.json()) as AccessControlDoc & { error?: string };
  if (!usersRes.ok) throw new Error(usersData.error || "users");
  if (!accessRes.ok) throw new Error(accessData.error || "access");
  return {
    users: usersData.users ?? [],
    access: { roles: accessData.roles ?? [], matrix: accessData.matrix ?? {} },
  };
}

export default function AccessControlUsersPage() {
  const t = useTranslations("admin.accessControl");
  const tTiers = useTranslations("admin.rolesPage.tiers");
  const tCommon = useTranslations("admin.common");
  const [users, setUsers] = useState<CmsUser[]>([]);
  const [access, setAccess] = useState<AccessControlDoc>({ roles: [], matrix: {} });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [draftOverrides, setDraftOverrides] = useState<PermissionOverrides>({});

  useEffect(() => {
    let cancelled = false;
    fetchUsersAndAccess()
      .then(({ users: list, access: doc }) => {
        if (cancelled) return;
        setUsers(list);
        setAccess(doc);
        const first = list[0];
        if (first) {
          setSelectedId(first.id);
          setDraftRole(first.role);
          setDraftOverrides(first.permissionOverrides ?? {});
        }
      })
      .catch(() => {
        if (!cancelled) toast.error(t("loadUsersFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const activeRoles = useMemo(
    () => access.roles.filter((r) => r.active).sort((a, b) => a.sortOrder - b.sortOrder),
    [access.roles]
  );
  const roleLabel = (id: string) => access.roles.find((r) => r.id === id)?.label ?? id;

  const normalizedQuery = query.trim().toLowerCase();
  const filteredUsers = normalizedQuery
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(normalizedQuery) ||
          u.email.toLowerCase().includes(normalizedQuery) ||
          roleLabel(u.role).toLowerCase().includes(normalizedQuery)
      )
    : users;

  const selected = users.find((u) => u.id === selectedId) ?? null;
  const isSuper = selected?.role === "super_admin";
  const dirty =
    Boolean(selected) &&
    (draftRole !== selected!.role ||
      stableStringify(draftOverrides) !== stableStringify(selected!.permissionOverrides ?? {}));
  const overridesCount = countOverrides(draftOverrides);

  const handleSelect = (user: CmsUser) => {
    setSelectedId(user.id);
    setDraftRole(user.role);
    setDraftOverrides(user.permissionOverrides ?? {});
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/cms/access-control/users/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: draftRole, permissionOverrides: draftOverrides }),
      });
      const data = (await res.json()) as { user?: CmsUser; error?: string };
      if (!res.ok) throw new Error(data.error || t("saveUserFailed"));
      if (data.user) {
        const saved = data.user;
        setUsers((prev) => prev.map((u) => (u.id === saved.id ? saved : u)));
        setDraftRole(saved.role);
        setDraftOverrides(saved.permissionOverrides ?? {});
      }
      toast.success(t("userSaved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("saveUserFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <FormSkeleton />;
  }

  return (
    <div>
      <AdminPageHeader
        title={t("usersTitle")}
        description={t("usersDescription")}
        actions={
          <Link
            href="/admin/access-control"
            className={buttonVariants({ variant: "outline", className: "rounded-full" })}
          >
            {t("backToMatrix")}
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="min-w-0 rounded-xl border border-border/60 bg-white">
          <div className="border-b border-border/60 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchUsers")}
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
          <ul className="max-h-[70vh] space-y-0.5 overflow-y-auto p-2">
            {filteredUsers.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                {t("noUsersFound")}
              </li>
            ) : null}
            {filteredUsers.map((user) => {
              const active = user.id === selectedId;
              const tier = roleTier(user.role);
              const userOverrides = countOverrides(user.permissionOverrides);
              return (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(user)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                      active ? "bg-oboya-blue/5 ring-1 ring-oboya-blue/30" : "hover:bg-oboya-soft-white"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                        TIER_AVATAR[tier],
                        user.status !== "active" && "opacity-40"
                      )}
                    >
                      {initials(user.name) || "?"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-oboya-blue-dark">
                        {user.name}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {roleLabel(user.role)}
                        {user.status !== "active" ? ` · ${tCommon("inactive")}` : ""}
                      </span>
                    </span>
                    {userOverrides > 0 ? (
                      <span
                        title={t("overridesCount", { count: userOverrides })}
                        className="rounded-full bg-oboya-orange/10 px-1.5 text-[10px] font-semibold text-oboya-orange"
                      >
                        {userOverrides}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="min-w-0 rounded-xl border border-border/60 bg-white">
          {selected ? (
            <>
              <div className="flex flex-wrap items-center gap-4 border-b border-border/60 p-4">
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    TIER_AVATAR[roleTier(draftRole)]
                  )}
                >
                  {initials(selected.name) || "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold text-oboya-blue-dark">
                    {selected.name}
                  </h2>
                  <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                    <span className="truncate">{selected.email}</span>
                    <Link
                      href={`/admin/users/${selected.id}`}
                      className="inline-flex items-center gap-1 text-oboya-blue-light hover:underline"
                    >
                      {t("openUserDetail")} <ExternalLink className="size-3" />
                    </Link>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {dirty ? (
                    <span className="text-[11px] font-medium text-oboya-orange">
                      {tCommon("unsavedChanges")}
                    </span>
                  ) : null}
                  <Button
                    type="button"
                    className="rounded-full bg-oboya-blue text-white hover:bg-oboya-blue/90"
                    disabled={saving || isSuper || !dirty}
                    onClick={() => void handleSave()}
                  >
                    {saving ? t("saving") : t("save")}
                  </Button>
                </div>
              </div>

              <div className="space-y-5 p-4">
                <div className="grid gap-4 sm:grid-cols-[minmax(0,320px)_1fr] sm:items-end">
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium text-oboya-blue-dark">{tCommon("role")}</span>
                    <select
                      value={draftRole}
                      disabled={isSuper}
                      onChange={(e) => setDraftRole(e.target.value)}
                      className="h-9 w-full rounded-lg border border-input bg-white px-2.5 text-sm"
                    >
                      {ROLE_TIERS.map((tier) => {
                        const tierRoles = activeRoles.filter((r) => roleTier(r.id) === tier);
                        if (tierRoles.length === 0) return null;
                        return (
                          <optgroup key={tier} label={tTiers(tier)}>
                            {tierRoles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.label}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                  </label>
                  {!isSuper ? (
                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                      <span className="text-xs text-muted-foreground">
                        {overridesCount > 0
                          ? t("overridesCount", { count: overridesCount })
                          : t("noOverrides")}
                      </span>
                      {overridesCount > 0 ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => setDraftOverrides({})}
                        >
                          <RotateCcw className="size-3.5" />
                          {t("clearOverrides")}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {isSuper ? (
                  <p className="rounded-lg bg-oboya-soft-white p-3 text-sm text-muted-foreground">
                    {t("superAdminNoOverrides")}
                  </p>
                ) : (
                  <UserOverridesEditor
                    overrides={draftOverrides}
                    roleLevels={access.matrix[draftRole] ?? {}}
                    onChange={setDraftOverrides}
                  />
                )}
              </div>
            </>
          ) : (
            <p className="p-4 text-sm text-muted-foreground">{t("selectUser")}</p>
          )}
        </section>
      </div>
      <EditorGuard dirty={dirty} saving={saving} onSave={() => void handleSave()} />
    </div>
  );
}
