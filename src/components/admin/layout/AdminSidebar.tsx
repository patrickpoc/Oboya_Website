"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { adminNavigation } from "@/lib/cms/navigation";
import { useAdmin } from "@/contexts/AdminContext";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onNavigate?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  const { can } = useAdmin();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border/60 bg-white transition-transform duration-300 lg:z-30 lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-border/60 px-4">
        <div className="flex items-center gap-2">
          <Logo className="h-7 w-auto" href="/admin/dashboard" intl={false} />
          <span className="text-xs font-semibold text-muted-foreground">Admin</span>
        </div>
        <button
          type="button"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
          aria-label="Close navigation"
          onClick={onNavigate}
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {adminNavigation.map((item) => {
            if (item.module && !can(item.module, "view")) return null;

            if (!item.children) {
              const active = pathname === item.href;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href ?? "#"}
                    prefetch
                    onClick={onNavigate}
                    className={cn(
                      "flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-oboya-green/10 font-medium text-oboya-green"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    {item.icon && <item.icon className="size-4 shrink-0" />}
                    {item.label}
                  </Link>
                </li>
              );
            }

            return (
              <NavGroup
                key={item.label}
                item={item}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

function NavGroup({
  item,
  pathname,
  onNavigate,
}: {
  item: (typeof adminNavigation)[number];
  pathname: string;
  onNavigate?: () => void;
}) {
  const isChildActive = item.children?.some(
    (c) => c.href && (pathname === c.href || pathname.startsWith(c.href + "/"))
  );
  const [open, setOpen] = useState(Boolean(isChildActive));

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
          isChildActive
            ? "font-medium text-oboya-blue-dark"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        )}
      >
        {item.icon && <item.icon className="size-4 shrink-0" />}
        <span className="flex-1 text-left">{item.label}</span>
        {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
      </button>
      {open && (
        <ul className="mt-1 ml-4 space-y-0.5 border-l border-border/50 pl-3">
          {item.children?.map((child) => {
            const active =
              child.href &&
              (pathname === child.href || pathname.startsWith(child.href + "/"));
            return (
              <li key={child.label}>
                <Link
                  href={child.href ?? "#"}
                  prefetch
                  onClick={onNavigate}
                  className={cn(
                    "flex min-h-11 items-center rounded-md px-2 py-2 text-sm transition-colors md:py-1.5 md:text-xs",
                    active
                      ? "bg-oboya-green/10 font-medium text-oboya-green"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
