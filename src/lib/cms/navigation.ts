import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  Globe2,
  Image,
  LayoutDashboard,
  Map,
  Newspaper,
  Settings,
  ShoppingBag,
  Users,
  ClipboardList,
  History,
} from "lucide-react";
import type { CmsModule } from "@/lib/cms/types";

export interface AdminNavItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
  module?: CmsModule;
  /** True when the route is a placeholder UI without durable CMS backend. */
  stub?: boolean;
  children?: AdminNavItem[];
}

export const adminNavigation: AdminNavItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    module: "dashboard",
  },
  {
    label: "Website",
    icon: Globe2,
    module: "website",
    children: [
      { label: "Home", href: "/admin/website/home" },
      { label: "About Us", href: "/admin/website/about" },
      { label: "News Page", href: "/admin/website/news" },
      { label: "Pages", href: "/admin/website/pages", stub: true },
      { label: "FAQs", href: "/admin/website/faqs" },
      { label: "Terms & Conditions", href: "/admin/website/terms", stub: true },
      { label: "Header", href: "/admin/website/header", stub: true },
      { label: "Footer", href: "/admin/website/footer", stub: true },
      { label: "SEO", href: "/admin/website/seo", stub: true },
    ],
  },
  {
    label: "Marketplace",
    icon: ShoppingBag,
    module: "marketplace",
    children: [
      { label: "Products", href: "/admin/marketplace/products" },
      { label: "Bulk Import", href: "/admin/marketplace/products/bulk-import" },
      { label: "Bulk Update", href: "/admin/marketplace/products/bulk-update" },
      { label: "Filters", href: "/admin/marketplace/filters" },
      { label: "Specifications", href: "/admin/marketplace/specifications", stub: true },
      { label: "Currencies", href: "/admin/marketplace/currencies" },
      { label: "Shop Config", href: "/admin/marketplace/shop-config" },
    ],
  },
  {
    label: "Global Presence",
    icon: Map,
    module: "global_presence",
    children: [
      { label: "Countries", href: "/admin/global-presence/countries", stub: true },
      { label: "Offices", href: "/admin/global-presence/offices", stub: true },
      { label: "Partners", href: "/admin/global-presence/partners", stub: true },
      { label: "Interactive Map", href: "/admin/global-presence/map" },
    ],
  },
  {
    label: "Case Studies",
    icon: Briefcase,
    module: "case_studies",
    children: [{ label: "All Cases", href: "/admin/case-studies" }],
  },
  {
    label: "Blog",
    icon: Newspaper,
    module: "blog",
    children: [
      { label: "Posts", href: "/admin/blog/posts" },
      { label: "Categories", href: "/admin/blog/categories" },
      { label: "Authors", href: "/admin/blog/authors" },
    ],
  },
  {
    label: "Careers",
    icon: Building2,
    module: "careers",
    children: [
      { label: "Job Openings", href: "/admin/careers/openings", stub: true },
      { label: "Applications", href: "/admin/careers/applications", stub: true },
    ],
  },
  {
    label: "Media Library",
    href: "/admin/media",
    icon: Image,
    module: "media",
  },
  {
    label: "Forms & Leads",
    icon: ClipboardList,
    module: "forms",
    children: [
      { label: "Contact", href: "/admin/forms/contact" },
      { label: "Quote Requests", href: "/admin/forms/quotes" },
      { label: "Newsletter", href: "/admin/forms/newsletter", stub: true },
    ],
  },
  {
    label: "Users & Permissions",
    icon: Users,
    module: "users",
    children: [
      { label: "Users", href: "/admin/users" },
      { label: "Roles", href: "/admin/users/roles" },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    module: "settings",
    children: [
      { label: "General", href: "/admin/settings/general", stub: true },
      { label: "Localization", href: "/admin/settings/localization", stub: true },
      { label: "Languages", href: "/admin/settings/languages", stub: true },
      { label: "Social Networks", href: "/admin/settings/social", stub: true },
      { label: "Integrations", href: "/admin/settings/integrations", stub: true },
      { label: "Email Templates", href: "/admin/settings/email-templates", stub: true },
      { label: "Analytics", href: "/admin/settings/analytics", stub: true },
      { label: "Backups", href: "/admin/settings/backups", stub: true },
    ],
  },
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: History,
    module: "audit_logs",
  },
];

export function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const crumbs: { label: string; href?: string }[] = [
    { label: "Admin", href: "/admin/dashboard" },
  ];

  for (const group of adminNavigation) {
    if (group.href === pathname) {
      crumbs.push({ label: group.label });
      return crumbs;
    }
    for (const child of group.children ?? []) {
      if (child.href === pathname) {
        crumbs.push({ label: group.label });
        crumbs.push({ label: child.label });
        return crumbs;
      }
      if (child.href && pathname.startsWith(child.href + "/")) {
        crumbs.push({ label: group.label });
        crumbs.push({ label: child.label, href: child.href });
        crumbs.push({ label: "Edit" });
        return crumbs;
      }
    }
  }

  if (pathname === "/admin/profile") {
    crumbs.push({ label: "Profile" });
  }

  return crumbs;
}
