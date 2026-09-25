"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CMS_LOCALES, useAdmin } from "@/contexts/AdminContext";
import type { AccessRoleDefinition } from "@/lib/cms/permissions/access-types";
import type { CmsLocale, CmsRole, CmsUser } from "@/lib/cms/types";
import { SYSTEM_ROLE_IDS } from "@/lib/cms/types";

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

export default function UserDetailPage() {
  const t = useTranslations("admin.users");
  const tCommon = useTranslations("admin.common");
  const tRoles = useTranslations("admin.roles");
  const { user: actor } = useAdmin();
  const isSuperAdmin = actor.role === "super_admin";
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [user, setUser] = useState<CmsUser | null>(null);
  const [roleDefs, setRoleDefs] = useState<AccessRoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [role, setRole] = useState<CmsRole>("viewer");
  const [locale, setLocale] = useState<CmsLocale>("en");
  const [status, setStatus] = useState<CmsUser["status"]>("active");
  const [customPassword, setCustomPassword] = useState("");

  const assignableRoles = roleDefs.filter(
    (r) => r.active && (isSuperAdmin || r.id !== "super_admin")
  );
  const roleOptions =
    assignableRoles.length > 0
      ? assignableRoles
      : SYSTEM_ROLE_IDS.filter(
          (rid) => isSuperAdmin || rid !== "super_admin"
        ).map((rid) => ({
          id: rid,
          label: rid,
          system: true,
          active: true,
          sortOrder: 0,
        }));

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, accessRes] = await Promise.all([
        fetch(`/api/cms/users/${id}`),
        fetch("/api/cms/access-control", { cache: "no-store" }),
      ]);
      const data = (await userRes.json()) as { user?: CmsUser; error?: string };
      if (!userRes.ok) throw new Error(data.error || t("notFound"));
      if (!data.user) throw new Error(t("notFound"));
      setUser(data.user);
      setName(data.user.name);
      setEmail(data.user.email);
      setJobTitle(data.user.jobTitle ?? "");
      setRole(data.user.role);
      setLocale(data.user.locale);
      setStatus(data.user.status);
      if (accessRes.ok) {
        const access = (await accessRes.json()) as {
          roles?: AccessRoleDefinition[];
        };
        setRoleDefs(access.roles ?? []);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("loadUserFailed"));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

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
      if (!res.ok) throw new Error(data.error || t("updateFailedShort"));
      if (data.user) setUser(data.user);
      toast.success(t("updated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("updateActionFailed"));
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
      if (!res.ok) throw new Error(data.error || t("resetFailed"));
      toast.success(
        data.password
          ? t("passwordSetTo", { password: data.password })
          : t("passwordResetMustChange")
      );
      setCustomPassword("");
      await loadUser();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("resetActionFailed"));
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!confirm(t("deleteConfirmShort", { email: user.email }))) return;
    try {
      const res = await fetch(`/api/cms/users/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || t("deleteFailed"));
      toast.success(t("deleted"));
      router.push("/admin/users");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("deleteActionFailed"));
    }
  };

  if (loading) {
    return <div className="min-h-[40vh]" aria-hidden />;
  }

  if (!user) {
    return <p className="text-muted-foreground">{t("notFoundPeriod")}</p>;
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
            {t("backToUsers")}
          </Link>
        }
      />

      <div className="grid max-w-2xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("accountDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>{displayRoleLabel(user.role, roleDefs, tRoles)}</Badge>
              <Badge variant={user.status === "active" ? "default" : "secondary"}>
                {user.status === "active" ? tCommon("active") : tCommon("inactive")}
              </Badge>
              {user.mustChangePassword ? (
                <Badge variant="outline">{t("mustChangePassword")}</Badge>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label>{tCommon("name")}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isSuperAdmin && user.role === "super_admin"}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{tCommon("email")}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isSuperAdmin && user.role === "super_admin"}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{tCommon("jobTitle")}</Label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={!isSuperAdmin && user.role === "super_admin"}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{tCommon("role")}</Label>
              <select
                value={role}
                disabled={!isSuperAdmin && user.role === "super_admin"}
                onChange={(e) => setRole(e.target.value as CmsRole)}
                className="h-8 w-full rounded-lg border border-input px-2.5 text-sm"
              >
                {roleOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {displayRoleLabel(r.id, roleDefs, tRoles)}
                  </option>
                ))}
                {!isSuperAdmin && user.role === "super_admin" ? (
                  <option value="super_admin">
                    {displayRoleLabel("super_admin", roleDefs, tRoles)}
                  </option>
                ) : null}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{tCommon("locale")}</Label>
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
              <Label>{tCommon("status")}</Label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as CmsUser["status"])
                }
                className="h-8 w-full rounded-lg border border-input px-2.5 text-sm"
              >
                <option value="active">{tCommon("active")}</option>
                <option value="inactive">{tCommon("inactive")}</option>
              </select>
            </div>

            <Button
              onClick={() => void handleSave()}
              disabled={saving}
              className="rounded-full bg-oboya-green"
            >
              {saving ? tCommon("saving") : t("saveChanges")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("passwordSection")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("passwordHint")}
            </p>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => void handleResetPassword()}
            >
              {t("generateTempPassword")}
            </Button>
            <div className="space-y-1.5">
              <Label>{t("customTempPassword")}</Label>
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
              {t("setCustomPassword")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dangerZone")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="destructive"
              className="rounded-full"
              onClick={() => void handleDelete()}
            >
              {t("deleteUser")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
