"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Search, User } from "lucide-react";
import { getBreadcrumbs } from "@/lib/cms/navigation";
import { useAdmin } from "@/contexts/AdminContext";
import { ROLE_LABELS } from "@/lib/cms/permissions/matrix";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function AdminTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAdmin();
  const crumbs = getBreadcrumbs(pathname);

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    localStorage.removeItem("oboya-admin-user");
    router.push("/admin/login");
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border/60 bg-white/95 px-6 backdrop-blur">
      <nav className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => (
          <span key={crumb.label} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-muted-foreground/50">/</span>}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="truncate text-muted-foreground hover:text-foreground"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="truncate font-medium text-oboya-blue-dark">
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      <div className="hidden items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 md:flex">
        <Search className="size-3.5 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search..."
          className="w-40 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
      </div>

      <button
        type="button"
        className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-oboya-green" />
      </button>

      <Link
        href="/admin/profile"
        className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted"
      >
        <div className="flex size-7 items-center justify-center rounded-full bg-oboya-green/10 text-xs font-semibold text-oboya-green">
          {user.name.charAt(0)}
        </div>
        <div className="hidden text-left lg:block">
          <p className="text-xs font-medium text-oboya-blue-dark">{user.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {ROLE_LABELS[user.role]}
          </p>
        </div>
      </Link>

      <button
        type="button"
        onClick={handleLogout}
        className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
        aria-label="Logout"
      >
        <LogOut className="size-4" />
      </button>
    </header>
  );
}
