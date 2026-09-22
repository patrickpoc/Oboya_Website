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

export default function ForgotPasswordPage() {
  const t = useTranslations("admin.auth");
  const tCommon = useTranslations("admin.common");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!isSupabaseConfigured()) {
      toast.success(t("resetEmailMock"));
      setSent(true);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });

    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success(t("checkEmail"));
  };

  return (
    <Container className="flex min-h-screen items-center justify-center py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-white p-6 shadow-[var(--shadow-card)]">
        <Logo className="mb-4 h-8 w-auto" />
        <h1 className="font-display text-xl font-semibold text-oboya-blue-dark">
          {t("forgotTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("forgotSubtitle")}
        </p>

        {sent ? (
          <p className="mt-6 text-sm text-oboya-green">
            {t("forgotSent")}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{tCommon("email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={loading}>
              {loading ? t("sending") : t("sendResetLink")}
            </Button>
          </form>
        )}

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
