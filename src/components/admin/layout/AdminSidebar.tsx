"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { adminNavigation } from "@/lib/cms/navigation";
import { useAdmin } from "@/contexts/AdminContext";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const pathname = usePathname();
  const { can } = useAdmin();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border/60 bg-white">
      <div className="flex h-14 items-center border-b border-border/60 px-4">
        <div className="flex items-center gap-2">
          <Logo className="h-7 w-auto" href="/admin/dashboard" intl={false} />
          <span className="text-xs font-semibold text-muted-foreground">Admin</span>
        </div>
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
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
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
}: {
  item: (typeof adminNavigation)[number];
  pathname: string;
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
          "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
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
                  className={cn(
                    "block rounded-md px-2 py-1.5 text-xs transition-colors",
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
