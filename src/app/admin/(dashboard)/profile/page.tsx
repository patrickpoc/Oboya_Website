"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button, buttonVariants } from "@/components/ui/button";
import { CMS_LOCALES, useAdmin } from "@/contexts/AdminContext";
import type { CmsLocale, CmsUser } from "@/lib/cms/types";

export default function ProfilePage() {
  const t = useTranslations("admin.profile");
  const tCommon = useTranslations("admin.common");
  const tRoles = useTranslations("admin.roles");
  const { user, setUser } = useAdmin();
  const [name, setName] = useState(user.name);
  const [jobTitle, setJobTitle] = useState(user.jobTitle ?? "");
  const [locale, setLocale] = useState<CmsLocale>(user.locale);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user.name);
    setJobTitle(user.jobTitle ?? "");
    setLocale(user.locale);
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/cms/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, jobTitle, locale }),
      });
      const data = (await res.json()) as { user?: CmsUser; error?: string };
      if (!res.ok) throw new Error(data.error || t("updateFailed"));
      if (data.user) setUser(data.user);
      toast.success(t("updated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("updateActionFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) return;
    if (newPassword.length < 8) {
      toast.error(t("passwordMinLength"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("passwordsMismatch"));
      return;
    }

    try {
      const res = await fetch("/api/cms/me/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || t("passwordUpdateFailed"));
      toast.success(t("passwordUpdated"));
      setNewPassword("");
      setConfirmPassword("");
      setUser({ ...user, mustChangePassword: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("updateActionFailed"));
    }
  };

  return (
    <div>
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
      />

      <div className="grid max-w-2xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("account")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-oboya-green/10 text-xl font-semibold text-oboya-green">
                {name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-oboya-blue-dark">{user.email}</p>
                <p className="text-sm text-muted-foreground">
                  {tRoles(user.role)}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">{t("fullName")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jobTitle">{tCommon("jobTitle")}</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="locale">{t("preferredLanguage")}</Label>
              <select
                id="locale"
                value={locale}
                onChange={(e) => setLocale(e.target.value as CmsLocale)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                {CMS_LOCALES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => void handleSaveProfile()}
              disabled={saving}
              className="rounded-full"
            >
              {saving ? tCommon("saving") : t("saveProfile")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("changePassword")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new">{t("newPassword")}</Label>
              <Input
                id="new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">{t("confirmPassword")}</Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <button
              type="button"
              onClick={() => void handleChangePassword()}
              className={buttonVariants({ className: "rounded-full" })}
            >
              {t("updatePassword")}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
