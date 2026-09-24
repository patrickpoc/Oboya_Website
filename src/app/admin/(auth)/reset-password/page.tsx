"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Logo";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { toast } from "sonner";
import { useAdminDocumentTitle } from "@/lib/cms/admin-document-title";

export default function ResetPasswordPage() {
  const t = useTranslations("admin.auth");
  useAdminDocumentTitle(t("resetTitle"));
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error(t("passwordsMismatch"));
      return;
    }

    setLoading(true);

    if (!isSupabaseConfigured()) {
      toast.success(t("passwordUpdatedMock"));
      window.location.href = "/admin/login";
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("passwordUpdated"));
    window.location.href = "/admin/login";
  };

  return (
    <Container className="flex min-h-screen items-center justify-center py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-white p-6 shadow-[var(--shadow-card)]">
        <Logo className="mb-4 h-8 w-auto" />
        <h1 className="font-display text-xl font-semibold text-oboya-blue-dark">
          {t("resetTitle")}
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">{t("newPassword")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">{t("confirmPassword")}</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={loading}>
            {loading ? t("updating") : t("updatePassword")}
          </Button>
        </form>

        <Link
          href="/admin/login"
          className="mt-4 block text-center text-sm text-oboya-green hover:underline"
        >
          {t("backToLogin")}
        </Link>
      </div>
    </Container>
  );
}
