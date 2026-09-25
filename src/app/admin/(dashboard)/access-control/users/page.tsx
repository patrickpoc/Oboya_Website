"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { UserOverridesEditor } from "@/components/admin/access-control/UserOverridesEditor";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import type { AccessControlDoc } from "@/lib/cms/permissions/access-types";
import type { CmsUser, PermissionOverrides } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

export default function AccessControlUsersPage() {
  const t = useTranslations("admin.accessControl");
  const tCommon = useTranslations("admin.common");
  const [users, setUsers] = useState<CmsUser[]>([]);
  const [roles, setRoles] = useState<AccessControlDoc["roles"]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draftRole, setDraftRole] = useState("");
  const [draftOverrides, setDraftOverrides] = useState<PermissionOverrides>({});

  const activeRoles = useMemo(
    () => roles.filter((r) => r.active).sort((a, b) => a.sortOrder - b.sortOrder),
    [roles]
  );

  const selected = users.find((u) => u.id === selectedId) ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, accessRes] = await Promise.all([
        fetch("/api/cms/access-control/users", { cache: "no-store" }),
        fetch("/api/cms/access-control", { cache: "no-store" }),
      ]);
      const usersData = (await usersRes.json()) as {
        users?: CmsUser[];
        error?: string;
      };
      const accessData = (await accessRes.json()) as AccessControlDoc & {
        error?: string;
      };
      if (!usersRes.ok) throw new Error(usersData.error || t("loadUsersFailed"));
      if (!accessRes.ok) throw new Error(accessData.error || t("loadFailed"));
      setUsers(usersData.users ?? []);
      setRoles(accessData.roles ?? []);
      const first = usersData.users?.[0];
      if (first) {
        setSelectedId(first.id);
        setDraftRole(first.role);
        setDraftOverrides(first.permissionOverrides ?? {});
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("loadUsersFailed")
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selected) return;
    setDraftRole(selected.role);
    setDraftOverrides(selected.permissionOverrides ?? {});
  }, [selected]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/cms/access-control/users/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: draftRole,
          permissionOverrides: draftOverrides,
        }),
      });
      const data = (await res.json()) as { user?: CmsUser; error?: string };
      if (!res.ok) throw new Error(data.error || t("saveUserFailed"));
      if (data.user) {
        setUsers((prev) =>
          prev.map((u) => (u.id === data.user!.id ? data.user! : u))
        );
      }
      toast.success(t("userSaved"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("saveUserFailed")
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-[40vh]" aria-hidden />;
  }

  return (
    <div>
      <AdminPageHeader
        title={t("usersTitle")}
        description={t("usersDescription")}
        actions={
          <Link
            href="/admin/access-control"
            className={buttonVariants({
              variant: "outline",
              className: "rounded-full",
            })}
          >
            {t("backToMatrix")}
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="rounded-xl border border-border/60 bg-white p-3">
          <ul className="max-h-[70vh] space-y-1 overflow-y-auto">
            {users.map((user) => {
              const active = user.id === selectedId;
              return (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(user.id)}
                    className={cn(
                      "flex w-full flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left transition-colors",
                      active
                        ? "bg-oboya-blue/5 ring-1 ring-oboya-blue/30"
                        : "hover:bg-muted/60"
                    )}
                  >
                    <span className="truncate text-sm font-medium text-oboya-blue-dark">
                      {user.name}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {user.email}
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {roles.find((r) => r.id === user.role)?.label ??
                          user.role}
                      </Badge>
                      <Badge
                        variant={
                          user.status === "active" ? "default" : "outline"
                        }
                        className="text-[10px]"
                      >
                        {user.status === "active"
                          ? tCommon("active")
                          : tCommon("inactive")}
                      </Badge>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-xl border border-border/60 bg-white p-4">
          {selected ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-oboya-blue-dark">
                    {selected.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selected.email}
                  </p>
                  <Link
                    href={`/admin/users/${selected.id}`}
                    className="mt-1 inline-block text-xs text-oboya-blue-light hover:underline"
                  >
                    {t("openUserDetail")}
                  </Link>
                </div>
                <Button
                  type="button"
                  className="rounded-full bg-oboya-blue text-white hover:bg-oboya-blue/90"
                  disabled={saving || selected.role === "super_admin"}
                  onClick={() => void handleSave()}
                >
                  {saving ? t("saving") : t("save")}
                </Button>
              </div>

              <div className="max-w-sm space-y-1.5">
                <label className="text-xs font-medium text-oboya-blue-dark">
                  {tCommon("role")}
                </label>
                <select
                  value={draftRole}
                  disabled={selected.role === "super_admin"}
                  onChange={(e) => setDraftRole(e.target.value)}
                  className="h-9 w-full rounded-lg border border-input px-2.5 text-sm"
                >
                  {activeRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {selected.role === "super_admin" ? (
                <p className="text-sm text-muted-foreground">
                  {t("superAdminNoOverrides")}
                </p>
              ) : (
                <UserOverridesEditor
                  overrides={draftOverrides}
                  onChange={setDraftOverrides}
                />
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("selectUser")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
