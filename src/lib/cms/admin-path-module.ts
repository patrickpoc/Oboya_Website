import type { CmsModule } from "@/lib/cms/types";

const PREFIXES: Array<{ prefix: string; module: CmsModule }> = [
  { prefix: "/admin/website", module: "website" },
  { prefix: "/admin/marketplace", module: "marketplace" },
  { prefix: "/admin/global-presence", module: "global_presence" },
  { prefix: "/admin/case-studies", module: "case_studies" },
  { prefix: "/admin/blog", module: "blog" },
  { prefix: "/admin/careers", module: "careers" },
  { prefix: "/admin/media", module: "media" },
  { prefix: "/admin/forms", module: "forms" },
  { prefix: "/admin/users", module: "users" },
  { prefix: "/admin/settings", module: "settings" },
  { prefix: "/admin/audit-logs", module: "audit_logs" },
  { prefix: "/admin/dashboard", module: "dashboard" },
];

export function isAccessControlPath(pathname: string): boolean {
  return (
    pathname === "/admin/access-control" ||
    pathname.startsWith("/admin/access-control/")
  );
}

export function moduleForAdminPath(pathname: string): CmsModule | null {
  if (pathname === "/admin" || pathname === "/admin/") return "dashboard";
  if (
    pathname.startsWith("/admin/profile") ||
    pathname.startsWith("/admin/change-password")
  ) {
    return null;
  }
  if (isAccessControlPath(pathname)) {
    return null;
  }
  for (const entry of PREFIXES) {
    if (pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`)) {
      return entry.module;
    }
  }
  return "dashboard";
}
