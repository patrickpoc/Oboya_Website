"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FormDrawer } from "@/components/admin/forms/FormDrawer";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_LABELS } from "@/lib/cms/permissions/matrix";
import { CMS_LOCALES } from "@/contexts/AdminContext";
import type { CmsLocale, CmsRole, CmsUser } from "@/lib/cms/types";

const DEFAULT_PASSWORD = "Oboya2026";

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

export default function UsersPage() {
  const [users, setUsers] = useState<CmsUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<DraftUser | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/cms/users");
      const data = (await res.json()) as {
        users?: CmsUser[];
        error?: string;
        debug?: Record<string, unknown>;
      };
      if (!res.ok) {
        const debugHint = data.debug
          ? ` (${JSON.stringify(data.debug)})`
          : "";
        throw new Error(`${data.error || "Failed to load users"}${debugHint}`);
      }
      setUsers(data.users ?? []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load users";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const openCreate = () => {
    setEditing({
      email: "",
      name: "",
      role: "viewer",
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
      toast.error("Name and email are required");
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
          defaultPassword?: string;
        };
        if (!res.ok) throw new Error(data.error || "Failed to create user");
        toast.success(
          `User created. Temporary password: ${data.defaultPassword ?? DEFAULT_PASSWORD}`
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
        if (!res.ok) throw new Error(data.error || "Failed to update user");
        toast.success("User updated");
      }

      setDrawerOpen(false);
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (user: CmsUser) => {
    if (
      !confirm(
        `Reset password for ${user.email} to ${DEFAULT_PASSWORD}? They will be asked to change it on next login.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/cms/users/${user.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as { error?: string; password?: string };
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      toast.success(`Password reset to ${data.password ?? DEFAULT_PASSWORD}`);
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reset failed");
    }
  };

  const handleDelete = async (user: CmsUser) => {
    if (!confirm(`Delete user ${user.email}? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/cms/users/${user.id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      toast.success("User deleted");
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const columns = useMemo(
    () => [
      { key: "name", header: "Name", sortable: true, cell: (r: CmsUser) => r.name },
      { key: "email", header: "Email", cell: (r: CmsUser) => r.email },
      { key: "role", header: "Role", cell: (r: CmsUser) => ROLE_LABELS[r.role] },
      {
        key: "status",
        header: "Status",
        cell: (r: CmsUser) => (
          <div className="flex flex-wrap gap-1">
            <Badge variant={r.status === "active" ? "default" : "secondary"}>
              {r.status}
            </Badge>
            {r.mustChangePassword ? (
              <Badge variant="outline">Must change password</Badge>
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
              title="Edit"
              onClick={() => openEdit(r)}
              className="rounded p-1 hover:bg-muted"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              title="Reset password"
              onClick={() => void handleResetPassword(r)}
              className="rounded p-1 hover:bg-muted"
            >
              <KeyRound className="size-3.5" />
            </button>
            <button
              type="button"
              title="Delete"
              onClick={() => void handleDelete(r)}
              className="rounded p-1 text-destructive hover:bg-muted"
            >
              <Trash2 className="size-3.5" />
            </button>
            <Link href={`/admin/users/${r.id}`} className="text-xs text-oboya-green">
              View
            </Link>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div>
      <AdminPageHeader
        title="Users"
        description="Manage admin accounts, roles, passwords and access."
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
            Add user
          </button>
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      ) : loadError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <p className="font-medium">Could not load users</p>
          <p className="mt-1 text-destructive/90">{loadError}</p>
          <button
            type="button"
            className="mt-3 text-oboya-green underline"
            onClick={() => void loadUsers()}
          >
            Retry
          </button>
        </div>
      ) : (
        <DataTable data={users} columns={columns} searchKey="email" />
      )}

      <FormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing?.isNew ? "New user" : editing?.name || "Edit user"}
        footer={
          <Button
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-full bg-oboya-green"
          >
            {saving ? "Saving…" : "Save user"}
          </Button>
        }
      >
        {editing && (
          <div className="space-y-4">
            {editing.isNew && (
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                New users start with temporary password{" "}
                <span className="font-medium text-foreground">{DEFAULT_PASSWORD}</span>{" "}
                and must change it on first login.
              </p>
            )}
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={editing.email}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Job title</Label>
              <Input
                value={editing.jobTitle}
                onChange={(e) =>
                  setEditing({ ...editing, jobTitle: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select
                value={editing.role}
                onChange={(e) =>
                  setEditing({ ...editing, role: e.target.value as CmsRole })
                }
                className="h-8 w-full rounded-lg border border-input px-2.5 text-sm"
              >
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Locale</Label>
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
              <Label>Status</Label>
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        )}
      </FormDrawer>
    </div>
  );
}
