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
  /** Key under `admin.nav.*` */
  labelKey: string;
  /** English fallback for non-i18n callers */
  label: string;
  href?: string;
  icon?: LucideIcon;
  module?: CmsModule;
  children?: AdminNavItem[];
}

export const adminNavigation: AdminNavItem[] = [
  {
    labelKey: "dashboard",
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    module: "dashboard",
  },
  {
    labelKey: "website",
    label: "Website",
    icon: Globe2,
    module: "website",
    children: [
      { labelKey: "home", label: "Home", href: "/admin/website/home" },
      { labelKey: "aboutUs", label: "About Us", href: "/admin/website/about" },
      { labelKey: "newsPage", label: "News Page", href: "/admin/website/news" },
      { labelKey: "pages", label: "Pages", href: "/admin/website/pages" },
      { labelKey: "faqs", label: "FAQs", href: "/admin/website/faqs" },
      { labelKey: "terms", label: "Terms & Conditions", href: "/admin/website/terms" },
      { labelKey: "header", label: "Header", href: "/admin/website/header" },
      { labelKey: "footer", label: "Footer", href: "/admin/website/footer" },
      { labelKey: "seo", label: "SEO", href: "/admin/website/seo" },
    ],
  },
  {
    labelKey: "marketplace",
    label: "Marketplace",
    icon: ShoppingBag,
    module: "marketplace",
    children: [
      { labelKey: "products", label: "Products", href: "/admin/marketplace/products" },
      { labelKey: "bulkImport", label: "Bulk Import", href: "/admin/marketplace/products/bulk-import" },
      { labelKey: "bulkUpdate", label: "Bulk Update", href: "/admin/marketplace/products/bulk-update" },
      { labelKey: "filters", label: "Filters", href: "/admin/marketplace/filters" },
      { labelKey: "specifications", label: "Specifications", href: "/admin/marketplace/specifications" },
      { labelKey: "currencies", label: "Currencies", href: "/admin/marketplace/currencies" },
      { labelKey: "shopConfig", label: "Shop Config", href: "/admin/marketplace/shop-config" },
    ],
  },
  {
    labelKey: "globalPresence",
    label: "Global Presence",
    icon: Map,
    module: "global_presence",
    children: [
      { labelKey: "countries", label: "Countries", href: "/admin/global-presence/countries" },
      { labelKey: "offices", label: "Offices", href: "/admin/global-presence/offices" },
      { labelKey: "partners", label: "Partners", href: "/admin/global-presence/partners" },
      { labelKey: "interactiveMap", label: "Interactive Map", href: "/admin/global-presence/map" },
    ],
  },
  {
    labelKey: "caseStudies",
    label: "Case Studies",
    icon: Briefcase,
    module: "case_studies",
    children: [{ labelKey: "allCases", label: "All Cases", href: "/admin/case-studies" }],
  },
  {
    labelKey: "blog",
    label: "Blog",
    icon: Newspaper,
    module: "blog",
    children: [
      { labelKey: "posts", label: "Posts", href: "/admin/blog/posts" },
      { labelKey: "categories", label: "Categories", href: "/admin/blog/categories" },
      { labelKey: "authors", label: "Authors", href: "/admin/blog/authors" },
    ],
  },
  {
    labelKey: "careers",
    label: "Careers",
    icon: Building2,
    module: "careers",
    children: [
      { labelKey: "jobOpenings", label: "Job Openings", href: "/admin/careers/openings" },
      { labelKey: "applications", label: "Applications", href: "/admin/careers/applications" },
    ],
  },
  {
    labelKey: "mediaLibrary",
    label: "Media Library",
    href: "/admin/media",
    icon: Image,
    module: "media",
  },
  {
    labelKey: "formsLeads",
    label: "Forms & Leads",
    icon: ClipboardList,
    module: "forms",
    children: [
      { labelKey: "contact", label: "Contact", href: "/admin/forms/contact" },
      { labelKey: "quoteRequests", label: "Quote Requests", href: "/admin/forms/quotes" },
      { labelKey: "newsletter", label: "Newsletter", href: "/admin/forms/newsletter" },
    ],
  },
  {
    labelKey: "usersPermissions",
    label: "Users & Permissions",
    icon: Users,
    module: "users",
    children: [
      { labelKey: "users", label: "Users", href: "/admin/users" },
      { labelKey: "roles", label: "Roles", href: "/admin/users/roles" },
    ],
  },
  {
    labelKey: "settings",
    label: "Settings",
    icon: Settings,
    module: "settings",
    children: [
      { labelKey: "general", label: "General", href: "/admin/settings/general" },
      { labelKey: "localization", label: "Localization", href: "/admin/settings/localization" },
      { labelKey: "languages", label: "Languages", href: "/admin/settings/languages" },
      { labelKey: "socialNetworks", label: "Social Networks", href: "/admin/settings/social" },
      { labelKey: "integrations", label: "Integrations", href: "/admin/settings/integrations" },
      { labelKey: "emailTemplates", label: "Email Templates", href: "/admin/settings/email-templates" },
      { labelKey: "analytics", label: "Analytics", href: "/admin/settings/analytics" },
      { labelKey: "backups", label: "Backups", href: "/admin/settings/backups" },
    ],
  },
  {
    labelKey: "auditLogs",
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: History,
    module: "audit_logs",
  },
];

export function getBreadcrumbs(pathname: string): {
  labelKey?: string;
  label: string;
  href?: string;
}[] {
  const crumbs: { labelKey?: string; label: string; href?: string }[] = [
    { labelKey: "admin", label: "Admin", href: "/admin/dashboard" },
  ];

  for (const group of adminNavigation) {
    if (group.href === pathname) {
      crumbs.push({ labelKey: group.labelKey, label: group.label });
      return crumbs;
    }
    for (const child of group.children ?? []) {
      if (child.href === pathname) {
        crumbs.push({ labelKey: group.labelKey, label: group.label });
        crumbs.push({ labelKey: child.labelKey, label: child.label });
        return crumbs;
      }
      if (child.href && pathname.startsWith(child.href + "/")) {
        crumbs.push({ labelKey: group.labelKey, label: group.label });
        crumbs.push({
          labelKey: child.labelKey,
          label: child.label,
          href: child.href,
        });
        crumbs.push({ labelKey: "edit", label: "Edit" });
        return crumbs;
      }
    }
  }

  if (pathname === "/admin/profile") {
    crumbs.push({ labelKey: "profile", label: "Profile" });
  }

  return crumbs;
}
