"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/Logo";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function ChangePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        window.location.href = "/admin/dashboard";
        return;
      }

      const res = await fetch("/api/cms/me/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Failed to update password");
        setLoading(false);
        return;
      }

      // Ensure JWT metadata is refreshed before hitting middleware.
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.refreshSession();
      localStorage.removeItem("oboya-admin-user");

      window.location.href = "/admin/dashboard";
    } catch {
      setError("Failed to update password");
      setLoading(false);
    }
  };

  return (
    <Container className="flex min-h-screen items-center justify-center py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-white p-6 shadow-[var(--shadow-card)]">
        <Logo className="mb-4 h-8 w-auto" intl={false} />
        <h1 className="font-display text-xl font-semibold text-oboya-blue-dark">
          Create a new password
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          For security, you must set a personal password before accessing the
          admin dashboard.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full rounded-full" disabled={loading}>
            {loading ? "Saving…" : "Save password & continue"}
          </Button>
        </form>
      </div>
    </Container>
  );
}
