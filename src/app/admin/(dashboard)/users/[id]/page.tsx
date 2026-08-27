"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_LABELS } from "@/lib/cms/permissions/matrix";
import { CMS_LOCALES } from "@/contexts/AdminContext";
import type { CmsLocale, CmsRole, CmsUser } from "@/lib/cms/types";

const DEFAULT_PASSWORD = "Oboya2026";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [user, setUser] = useState<CmsUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [role, setRole] = useState<CmsRole>("viewer");
  const [locale, setLocale] = useState<CmsLocale>("en");
  const [status, setStatus] = useState<CmsUser["status"]>("active");
  const [customPassword, setCustomPassword] = useState("");

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cms/users/${id}`);
      const data = (await res.json()) as { user?: CmsUser; error?: string };
      if (!res.ok) throw new Error(data.error || "User not found");
      if (!data.user) throw new Error("User not found");
      setUser(data.user);
      setName(data.user.name);
      setEmail(data.user.email);
      setJobTitle(data.user.jobTitle ?? "");
      setRole(data.user.role);
      setLocale(data.user.locale);
      setStatus(data.user.status);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/cms/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          jobTitle,
          role,
          locale,
          status,
        }),
      });
      const data = (await res.json()) as { user?: CmsUser; error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to update");
      if (data.user) setUser(data.user);
      toast.success("User updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (password?: string) => {
    try {
      const res = await fetch(`/api/cms/users/${id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(password ? { password } : {}),
      });
      const data = (await res.json()) as { error?: string; password?: string };
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      toast.success(
        `Password set to ${data.password ?? password ?? DEFAULT_PASSWORD}. User must change it on next login.`
      );
      setCustomPassword("");
      await loadUser();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reset failed");
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!confirm(`Delete ${user.email}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/cms/users/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      toast.success("User deleted");
      router.push("/admin/users");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  if (!user) {
    return <p className="text-muted-foreground">User not found.</p>;
  }

  return (
    <div>
      <AdminPageHeader
        title={user.name}
        description={user.email}
        actions={
          <Link
            href="/admin/users"
            className={buttonVariants({
              variant: "outline",
              className: "rounded-full",
            })}
          >
            Back to users
          </Link>
        }
      />

      <div className="grid max-w-2xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>{ROLE_LABELS[user.role]}</Badge>
              <Badge variant={user.status === "active" ? "default" : "secondary"}>
                {user.status}
              </Badge>
              {user.mustChangePassword ? (
                <Badge variant="outline">Must change password</Badge>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Job title</Label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as CmsRole)}
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
                value={locale}
                onChange={(e) => setLocale(e.target.value as CmsLocale)}
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
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as CmsUser["status"])
                }
                className="h-8 w-full rounded-lg border border-input px-2.5 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <Button
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-full bg-oboya-green"
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Reset to the default temporary password ({DEFAULT_PASSWORD}) or set
              a custom one. The user must change it on next login.
            </p>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => void handleResetPassword()}
            >
              Reset to {DEFAULT_PASSWORD}
            </Button>
            <div className="space-y-1.5">
              <Label>Custom temporary password</Label>
              <Input
                type="password"
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                minLength={8}
              />
            </div>
            <Button
              type="button"
              className="rounded-full"
              disabled={customPassword.length < 8}
              onClick={() => void handleResetPassword(customPassword)}
            >
              Set custom password
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full"
              onClick={() => void handleDelete()}
            >
              Delete user
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
