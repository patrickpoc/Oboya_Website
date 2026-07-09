"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FormDrawer } from "@/components/admin/forms/FormDrawer";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteCmsUser,
  getCmsUsers,
  saveCmsUser,
} from "@/lib/cms/repositories/users-repository";
import { ROLE_LABELS } from "@/lib/cms/permissions/matrix";
import type { CmsRole, CmsUser } from "@/lib/cms/types";

export default function UsersPage() {
  const [users, setUsers] = useState(getCmsUsers());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CmsUser | null>(null);

  const openCreate = () => {
    setEditing({
      id: `user-${Date.now()}`,
      email: "",
      name: "",
      role: "viewer",
      locale: "en",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!editing) return;
    saveCmsUser(editing);
    setUsers([...getCmsUsers()]);
    setDrawerOpen(false);
    toast.success("User saved");
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
          <Badge variant={r.status === "active" ? "default" : "secondary"}>
            {r.status}
          </Badge>
        ),
      },
      {
        key: "actions",
        header: "",
        cell: (r: CmsUser) => (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => {
                setEditing({ ...r });
                setDrawerOpen(true);
              }}
              className="rounded p-1 hover:bg-muted"
            >
              <Pencil className="size-3.5" />
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
        description="Manage admin accounts, roles and access."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className={buttonVariants({
              className: "gap-1.5 rounded-full bg-oboya-green text-white hover:bg-oboya-green/90",
            })}
          >
            <Plus className="size-4" />
            Add user
          </button>
        }
      />
      <DataTable data={users} columns={columns} searchKey="email" />

      <FormDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing?.name || "New user"}
        footer={
          <Button onClick={handleSave} className="rounded-full bg-oboya-green">
            Save user
          </Button>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select
                value={editing.role}
                onChange={(e) => setEditing({ ...editing, role: e.target.value as CmsRole })}
                className="h-8 w-full rounded-lg border border-input px-2.5 text-sm"
              >
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select
                value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as CmsUser["status"] })}
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
