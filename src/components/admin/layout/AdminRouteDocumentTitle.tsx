"use client";

import { useLayoutEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { adminNavigation, type AdminNavItem } from "@/lib/cms/navigation";
import { setAdminDocumentTitle } from "@/lib/cms/admin-document-title";

function flattenNav(
  items: AdminNavItem[]
): Array<{ href: string; labelKey: string; label: string }> {
  const out: Array<{ href: string; labelKey: string; label: string }> = [];
  for (const item of items) {
    if (item.href) {
      out.push({ href: item.href, labelKey: item.labelKey, label: item.label });
    }
    if (item.children) out.push(...flattenNav(item.children));
  }
  return out;
}

/**
 * Route-based browser title so the tab is never blank while a page loads.
 * AdminPageHeader overrides this with the page H1 via useLayoutEffect.
 */
export function AdminRouteDocumentTitle() {
  const pathname = usePathname() || "/admin/dashboard";
  const t = useTranslations("admin");

  const title = useMemo(() => {
    const entries = flattenNav(adminNavigation).sort(
      (a, b) => b.href.length - a.href.length
    );
    const match = entries.find(
      (entry) =>
        pathname === entry.href || pathname.startsWith(`${entry.href}/`)
    );
    if (!match) {
      if (pathname.startsWith("/admin/profile")) {
        return t("profile.title");
      }
      return t("common.admin");
    }
    try {
      return t(`nav.${match.labelKey}`);
    } catch {
      return match.label;
    }
  }, [pathname, t]);

  useLayoutEffect(() => {
    setAdminDocumentTitle(title);
  }, [title]);

  return null;
}
