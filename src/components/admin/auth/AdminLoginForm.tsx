"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Logo";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { safeAdminNext } from "@/lib/security/admin-next";
import { useAdminDocumentTitle } from "@/lib/cms/admin-document-title";

export function AdminLoginForm() {
  const t = useTranslations("admin.auth");
  const tCommon = useTranslations("admin.common");
  useAdminDocumentTitle(t("signInTitle"));
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "auth" ? t("authFailed") : null
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      if (process.env.NODE_ENV !== "development") {
        setError(t("adminUnavailable"));
        setLoading(false);
        return;
      }
      window.location.href = safeAdminNext(searchParams.get("next"));
      return;
    }

    const supabase = createClient();

    // Drop any previous session before signing in as this account.
    await supabase.auth.signOut();
    localStorage.removeItem("oboya-admin-user");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const mustChange =
      user?.user_metadata?.must_change_password === true ||
      user?.app_metadata?.must_change_password === true;

    if (mustChange) {
      window.location.href = "/admin/change-password";
      return;
    }

    const next = safeAdminNext(searchParams.get("next"));
    window.location.href = next;
  };

  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV !== "development") {
      return (
        <Container className="flex min-h-screen items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">{t("adminUnavailable")}</p>
        </Container>
      );
    }
    return (
      <Container className="flex min-h-screen items-center justify-center py-12">
        <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-white p-6 shadow-[var(--shadow-card)]">
          <Logo className="mb-4 h-8 w-auto" href="/admin/dashboard" intl={false} />
          <h1 className="font-display text-xl font-semibold text-oboya-blue-dark">
            {t("oboyaAdmin")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("mockDevNote")}
          </p>
          <a
            href="/admin/dashboard"
            className={buttonVariants({ className: "mt-6 w-full rounded-full" })}
          >
            {t("openDashboard")}
          </a>
        </div>
      </Container>
    );
  }

  return (
    <Container className="flex min-h-screen items-center justify-center py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-white p-6 shadow-[var(--shadow-card)]">
        <Logo className="mb-4 h-8 w-auto" />
        <h1 className="font-display text-xl font-semibold text-oboya-blue-dark">
          {t("signInTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("signInSubtitle")}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">{tCommon("email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{tCommon("password")}</Label>
              <Link
                href="/admin/forgot-password"
                className="text-xs text-oboya-green hover:underline"
              >
                {t("forgotPassword")}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full rounded-full" disabled={loading}>
            {loading ? t("signingIn") : t("signIn")}
          </Button>
        </form>
      </div>
    </Container>
  );
}
