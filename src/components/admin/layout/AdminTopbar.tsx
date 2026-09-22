"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ExternalLink, LogOut, Menu, Search } from "lucide-react";
import { AdminLanguageSwitcher } from "@/components/admin/layout/AdminLanguageSwitcher";
import { getBreadcrumbs } from "@/lib/cms/navigation";
import { useAdmin } from "@/contexts/AdminContext";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";
import type { CmsRole } from "@/lib/cms/types";

interface AdminTopbarProps {
  onMenuClick?: () => void;
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAdmin();
  const t = useTranslations("admin");
  const crumbs = getBreadcrumbs(pathname);

  const crumbLabel = (crumb: (typeof crumbs)[number]) => {
    if (crumb.labelKey === "admin" || crumb.labelKey === "profile") {
      return t(`common.${crumb.labelKey}`);
    }
    if (crumb.labelKey === "edit") {
      return t("common.edit");
    }
    if (crumb.labelKey) {
      return t(`nav.${crumb.labelKey}`);
    }
    return crumb.label;
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    localStorage.removeItem("oboya-admin-user");
    router.push("/admin/login");
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border/60 bg-white/95 px-4 backdrop-blur md:gap-4 md:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
        aria-label={t("common.openNav")}
      >
        <Menu className="size-5" />
      </button>

      <nav className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => (
          <span
            key={`${crumb.labelKey ?? crumb.label}-${i}`}
            className={cn(
              "flex items-center gap-1.5",
              i > 0 && i < crumbs.length - 1 && "hidden sm:flex"
            )}
          >
            {i > 0 && <span className="text-muted-foreground/50">/</span>}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="truncate text-muted-foreground hover:text-foreground"
              >
                {crumbLabel(crumb)}
              </Link>
            ) : (
              <span className="truncate font-medium text-oboya-blue-dark">
                {crumbLabel(crumb)}
              </span>
            )}
          </span>
        ))}
      </nav>

      <Link
        href="/"
        aria-label={t("common.backToSite")}
        className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-border/60 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-oboya-blue-dark sm:px-3 sm:text-sm"
      >
        <ExternalLink className="size-3.5 shrink-0" aria-hidden />
        <span className="hidden sm:inline">{t("common.backToSite")}</span>
      </Link>

      <div className="hidden items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 md:flex">
        <Search className="size-3.5 text-muted-foreground" />
        <input
          type="search"
          placeholder={t("topbar.searchPlaceholder")}
          className="w-40 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
      </div>

      <AdminLanguageSwitcher />

      <Link
        href="/admin/profile"
        className="flex min-h-11 items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted"
      >
        <div className="flex size-7 items-center justify-center rounded-full bg-oboya-green/10 text-xs font-semibold text-oboya-green">
          {user.name.charAt(0)}
        </div>
        <div className="hidden text-left lg:block">
          <p className="text-xs font-medium text-oboya-blue-dark">{user.name}</p>
          <p className="text-[10px] text-muted-foreground">{user.email}</p>
          <p className="text-[10px] text-muted-foreground">
            {t(`roles.${user.role as CmsRole}`)}
          </p>
        </div>
      </Link>

      <button
        type="button"
        onClick={handleLogout}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
        aria-label={t("common.logout")}
      >
        <LogOut className="size-4" />
      </button>
    </header>
  );
}
