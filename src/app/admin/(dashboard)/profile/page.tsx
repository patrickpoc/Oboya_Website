"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button, buttonVariants } from "@/components/ui/button";
import { CMS_LOCALES, useAdmin } from "@/contexts/AdminContext";
import type { CmsLocale } from "@/lib/cms/types";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { ROLE_LABELS } from "@/lib/cms/permissions/matrix";

export default function ProfilePage() {
  const { user, setUser } = useAdmin();
  const [name, setName] = useState(user.name);
  const [jobTitle, setJobTitle] = useState(user.jobTitle ?? "");
  const [locale, setLocale] = useState<CmsLocale>(user.locale);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleSaveProfile = () => {
    setUser({
      ...user,
      name,
      jobTitle,
      locale,
      updatedAt: new Date().toISOString(),
    });
    toast.success("Profile updated");
  };

  const handleChangePassword = async () => {
    if (!newPassword) return;

    if (!isSupabaseConfigured()) {
      toast.success("Password changed (mock)");
      setCurrentPassword("");
      setNewPassword("");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    setCurrentPassword("");
    setNewPassword("");
  };

  return (
    <div>
      <AdminPageHeader
        title="Profile"
        description="Manage your account settings and preferences."
      />

      <div className="grid max-w-2xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-oboya-green/10 text-xl font-semibold text-oboya-green">
                {name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-oboya-blue-dark">{user.email}</p>
                <p className="text-sm text-muted-foreground">
                  {ROLE_LABELS[user.role]}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jobTitle">Job title</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="locale">Preferred language</Label>
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

            <Button onClick={handleSaveProfile} className="rounded-full">
              Save profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current">Current password</Label>
              <Input
                id="current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new">New password</Label>
              <Input
                id="new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={handleChangePassword}
              className={buttonVariants({ className: "rounded-full" })}
            >
              Update password
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
