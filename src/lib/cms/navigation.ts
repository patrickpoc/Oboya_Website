import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  FileText,
  FolderOpen,
  Globe2,
  Home,
  Image,
  LayoutDashboard,
  Map,
  Newspaper,
  Package,
  Settings,
  Shield,
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
      { label: "Pages", href: "/admin/website/pages" },
      { label: "FAQs", href: "/admin/website/faqs" },
      { label: "Terms & Conditions", href: "/admin/website/terms" },
      { label: "Header", href: "/admin/website/header" },
      { label: "Footer", href: "/admin/website/footer" },
      { label: "Catalogue", href: "/admin/website/catalogue" },
      { label: "SEO", href: "/admin/website/seo" },
    ],
  },
  {
    label: "Marketplace",
    icon: ShoppingBag,
    module: "marketplace",
    children: [
      { label: "Products", href: "/admin/marketplace/products" },
      { label: "Categories", href: "/admin/marketplace/categories" },
      { label: "Brands", href: "/admin/marketplace/brands" },
      { label: "Specifications", href: "/admin/marketplace/specifications" },
      { label: "Availability", href: "/admin/marketplace/availability" },
      { label: "Currencies", href: "/admin/marketplace/currencies" },
      { label: "Price Lists", href: "/admin/marketplace/price-lists" },
      { label: "Quote Requests", href: "/admin/marketplace/quote-requests" },
      { label: "Shop Config", href: "/admin/marketplace/shop-config" },
    ],
  },
  {
    label: "Global Presence",
    icon: Map,
    module: "global_presence",
    children: [
      { label: "Countries", href: "/admin/global-presence/countries" },
      { label: "Offices", href: "/admin/global-presence/offices" },
      { label: "Partners", href: "/admin/global-presence/partners" },
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
      { label: "Job Openings", href: "/admin/careers/openings" },
      { label: "Applications", href: "/admin/careers/applications" },
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
      { label: "Newsletter", href: "/admin/forms/newsletter" },
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
      { label: "General", href: "/admin/settings/general" },
      { label: "Localization", href: "/admin/settings/localization" },
      { label: "Languages", href: "/admin/settings/languages" },
      { label: "Social Networks", href: "/admin/settings/social" },
      { label: "Integrations", href: "/admin/settings/integrations" },
      { label: "Email Templates", href: "/admin/settings/email-templates" },
      { label: "Analytics", href: "/admin/settings/analytics" },
      { label: "Backups", href: "/admin/settings/backups" },
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
