"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FormDrawer } from "@/components/admin/forms/FormDrawer";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CMS_LOCALES, useAdmin } from "@/contexts/AdminContext";
import type { AccessRoleDefinition } from "@/lib/cms/permissions/access-types";
import type { CmsLocale, CmsRole, CmsUser } from "@/lib/cms/types";
import { SYSTEM_ROLE_IDS } from "@/lib/cms/types";

type DraftUser = {
  id?: string;
  email: string;
  name: string;
  role: CmsRole;
  locale: CmsLocale;
  jobTitle: string;
  status: CmsUser["status"];
  isNew: boolean;
};

function displayRoleLabel(
  roleId: string,
  roles: AccessRoleDefinition[],
  tRoles: (key: string) => string
): string {
  const found = roles.find((r) => r.id === roleId);
  if (found) return found.label;
  if ((SYSTEM_ROLE_IDS as readonly string[]).includes(roleId)) {
    return tRoles(roleId);
  }
  return roleId;
}

export default function UsersPage() {
  const t = useTranslations("admin.users");
  const tCommon = useTranslations("admin.common");
  const tRoles = useTranslations("admin.roles");
  const { user: actor } = useAdmin();
  const isSuperAdmin = actor.role === "super_admin";
  const [users, setUsers] = useState<CmsUser[]>([]);
  const [roleDefs, setRoleDefs] = useState<AccessRoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<DraftUser | null>(null);

  const assignableRoles = useMemo(() => {
    const active = roleDefs.filter((r) => r.active);
    if (active.length === 0) {
      return SYSTEM_ROLE_IDS.filter(
        (id) => isSuperAdmin || id !== "super_admin"
      ).map((id) => ({ id, label: id, system: true, active: true, sortOrder: 0 }));
    }
    return active.filter((r) => isSuperAdmin || r.id !== "super_admin");
  }, [roleDefs, isSuperAdmin]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [usersRes, accessRes] = await Promise.all([
        fetch("/api/cms/users"),
        fetch("/api/cms/access-control", { cache: "no-store" }),
      ]);
      const data = (await usersRes.json()) as {
        users?: CmsUser[];
        error?: string;
      };
      if (!usersRes.ok) {
        throw new Error(data.error || t("loadFailed"));
      }
      setUsers(data.users ?? []);
      if (accessRes.ok) {
        const access = (await accessRes.json()) as {
          roles?: AccessRoleDefinition[];
        };
        setRoleDefs(access.roles ?? []);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("loadFailed");
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const openCreate = () => {
    const defaultRole =
      assignableRoles.find((r) => r.id === "viewer")?.id ??
      assignableRoles[0]?.id ??
      "viewer";
    setEditing({
      email: "",
      name: "",
      role: defaultRole,
      locale: "en",
      jobTitle: "",
      status: "active",
      isNew: true,
    });
    setDrawerOpen(true);
  };

  const openEdit = (user: CmsUser) => {
    setEditing({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      locale: user.locale,
      jobTitle: user.jobTitle ?? "",
      status: user.status,
      isNew: false,
    });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name.trim() || !editing.email.trim()) {
      toast.error(t("nameEmailRequired"));
      return;
    }

    setSaving(true);
    try {
      if (editing.isNew) {
        const res = await fetch("/api/cms/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editing.name,
            email: editing.email,
            role: editing.role,
            locale: editing.locale,
            jobTitle: editing.jobTitle || undefined,
            status: editing.status,
          }),
        });
        const data = (await res.json()) as {
          error?: string;
          temporaryPassword?: string;
        };
        if (!res.ok) throw new Error(data.error || t("createFailed"));
        toast.success(
          data.temporaryPassword
            ? t("createdWithPassword", { password: data.temporaryPassword })
            : t("created")
        );
      } else if (editing.id) {
        const res = await fetch(`/api/cms/users/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editing.name,
            email: editing.email,
            role: editing.role,
            locale: editing.locale,
            jobTitle: editing.jobTitle,
            status: editing.status,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error || t("updateFailed"));
        toast.success(t("updated"));
      }

      setDrawerOpen(false);
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (user: CmsUser) => {
    if (!confirm(t("resetConfirm", { email: user.email }))) {
      return;
    }

    try {
      const res = await fetch(`/api/cms/users/${user.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as { error?: string; password?: string };
      if (!res.ok) throw new Error(data.error || t("resetFailed"));
      toast.success(
        data.password
          ? t("resetToPassword", { password: data.password })
          : t("resetSuccess")
      );
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("resetActionFailed"));
    }
  };

  const handleDelete = async (user: CmsUser) => {
    if (!confirm(t("deleteConfirm", { email: user.email }))) return;

    try {
      const res = await fetch(`/api/cms/users/${user.id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || t("deleteFailed"));
      toast.success(t("deleted"));
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("deleteActionFailed"));
    }
  };

  const columns = useMemo(
    () => [
      { key: "name", header: tCommon("name"), sortable: true, cell: (r: CmsUser) => r.name },
      { key: "email", header: tCommon("email"), cell: (r: CmsUser) => r.email },
      { key: "role", header: tCommon("role"), cell: (r: CmsUser) => displayRoleLabel(r.role, roleDefs, tRoles) },
      {
        key: "status",
        header: tCommon("status"),
        cell: (r: CmsUser) => (
          <div className="flex flex-wrap gap-1">
            <Badge variant={r.status === "active" ? "default" : "secondary"}>
              {r.status === "active" ? tCommon("active") : tCommon("inactive")}
            </Badge>
            {r.mustChangePassword ? (
              <Badge variant="outline">{t("mustChangePassword")}</Badge>
            ) : null}
          </div>
        ),
      },
      {
        key: "actions",
        header: "",
        cell: (r: CmsUser) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              title={tCommon("edit")}
              onClick={() => openEdit(r)}
              disabled={!isSuperAdmin && r.role === "super_admin"}
              className="rounded p-1 hover:bg-muted disabled:opacity-40"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              title={t("resetPassword")}
              onClick={() => void handleResetPassword(r)}
              className="rounded p-1 hover:bg-muted"
            >
              <KeyRound className="size-3.5" />
            </button>
            <button
              type="button"
              title={tCommon("delete")}
              onClick={() => void handleDelete(r)}
              className="rounded p-1 text-destructive hover:bg-muted"
            >
              <Trash2 className="size-3.5" />
            </button>
            <Link href={`/admin/users/${r.id}`} className="text-xs text-oboya-green">
              {tCommon("view")}
            </Link>
          </div>
        ),
      },
    ],
    [t, tCommon, tRoles, roleDefs, isSuperAdmin]
  );

  return (
    <div>
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <button
            type="button"
            onClick={openCreate}
            className={buttonVariants({
              className:
                "gap-1.5 rounded-full bg-oboya-green text-white hover:bg-oboya-green/90",
            })}
          >
            <Plus className="size-4" />
            {t("addUser")}
          </button>
        }
      />

      {loading ? null : loadError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <p className="font-medium">{t("loadErrorTitle")}</p>
          <p className="mt-1 text-destructive/90">{loadError}</p>
          <button
            type="button"
            className="mt-3 text-oboya-green underline"
            onClick={() => void loadUsers()}
          >
            {tCommon("retry")}
          </button>
        </div>
      ) : (
        <DataTable data={users} columns={columns} searchKey="email" />
      )}

      <FormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing?.isNew ? t("newUser") : editing?.name || t("editUser")}
        footer={
          <Button
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-full bg-oboya-green"
          >
            {saving ? tCommon("saving") : t("saveUser")}
          </Button>
        }
      >
        {editing && (
          <div className="space-y-4">
            {editing.isNew && (
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                {t("newUserHint")}
              </p>
            )}
            <div className="space-y-1.5">
              <Label>{tCommon("name")}</Label>
              <Input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{tCommon("email")}</Label>
              <Input
                type="email"
                value={editing.email}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{tCommon("jobTitle")}</Label>
              <Input
                value={editing.jobTitle}
                onChange={(e) =>
                  setEditing({ ...editing, jobTitle: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>{tCommon("role")}</Label>
              <select
                value={editing.role}
                disabled={
                  !isSuperAdmin && editing.role === "super_admin"
                }
                onChange={(e) =>
                  setEditing({ ...editing, role: e.target.value as CmsRole })
                }
                className="h-8 w-full rounded-lg border border-input px-2.5 text-sm"
              >
                {assignableRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {displayRoleLabel(role.id, roleDefs, tRoles)}
                  </option>
                ))}
                {!isSuperAdmin && editing.role === "super_admin" ? (
                  <option value="super_admin">
                    {displayRoleLabel("super_admin", roleDefs, tRoles)}
                  </option>
                ) : null}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{tCommon("locale")}</Label>
              <select
                value={editing.locale}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    locale: e.target.value as CmsLocale,
                  })
                }
                className="h-8 w-full rounded-lg border border-input px-2.5 text-sm"
              >
                {CMS_LOCALES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{tCommon("status")}</Label>
              <select
                value={editing.status}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    status: e.target.value as CmsUser["status"],
                  })
                }
                className="h-8 w-full rounded-lg border border-input px-2.5 text-sm"
              >
                <option value="active">{tCommon("active")}</option>
                <option value="inactive">{tCommon("inactive")}</option>
              </select>
            </div>
          </div>
        )}
      </FormDrawer>
    </div>
  );
}
