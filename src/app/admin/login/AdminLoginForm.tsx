"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { createClient } from "@/lib/supabase/client";

const isSupabaseConfigured =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "auth" ? "Authentication failed." : null
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const next = searchParams.get("next") ?? "/admin/map";
    window.location.href = next;
  };

  if (!isSupabaseConfigured) {
    return (
      <Container className="flex min-h-screen items-center justify-center py-12">
        <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-white p-6 shadow-[var(--shadow-card)]">
          <h1 className="font-display text-xl font-semibold text-oboya-blue-dark">
            Oboya Admin
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Supabase is not configured. Local development uses the JSON file
            directly.
          </p>
          <a
            href="/admin/map"
            className={buttonVariants({ className: "mt-6 w-full" })}
          >
            Open map editor
          </a>
        </div>
      </Container>
    );
  }

  return (
    <Container className="flex min-h-screen items-center justify-center py-12">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-white p-6 shadow-[var(--shadow-card)]">
        <h1 className="font-display text-xl font-semibold text-oboya-blue-dark">
          Oboya Admin
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to edit map locations.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </label>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </Container>
  );
}

export { AdminLoginForm };
