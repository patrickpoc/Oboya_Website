import fs from "fs";
import path from "path";

const pages = [
  ["website/home", "Home", "Manage homepage sections and content.", "website"],
  ["website/pages", "Pages", "Manage institutional and marketing pages.", "website"],
  ["website/faqs", "FAQs", "Manage frequently asked questions.", "website"],
  ["website/terms", "Terms & Conditions", "Manage legal terms content.", "website"],
  ["website/header", "Header & Navigation", "Manage main navigation and header.", "website"],
  ["website/footer", "Footer", "Manage footer links and content.", "website"],
  ["website/catalogue", "Catalogue", "Manage PDF catalogue settings.", "website"],
  ["website/seo", "SEO", "Manage global and page-level SEO settings.", "website"],
  ["marketplace/categories", "Categories", "Manage product categories.", "marketplace"],
  ["marketplace/brands", "Brands", "Manage product brands.", "marketplace"],
  ["marketplace/specifications", "Specifications", "Manage product specification templates.", "marketplace"],
  ["marketplace/availability", "Availability by Country", "Manage product availability per market.", "marketplace"],
  ["marketplace/currencies", "Currencies", "Manage supported currencies.", "marketplace"],
  ["marketplace/price-lists", "Price Lists", "Manage price lists by market.", "marketplace"],
  ["marketplace/quote-requests", "Quote Requests", "Review and manage quote requests.", "marketplace"],
  ["marketplace/shop-config", "Shop Configuration", "Configure shop settings and banners.", "marketplace"],
  ["global-presence/countries", "Countries", "Manage country and market information.", "global_presence"],
  ["global-presence/offices", "Offices", "Manage commercial offices worldwide.", "global_presence"],
  ["global-presence/partners", "Partners", "Manage partner information.", "global_presence"],
  ["case-studies", "Case Studies", "Manage case studies and success stories.", "case_studies"],
  ["blog/categories", "Blog Categories", "Manage blog categories.", "blog"],
  ["blog/authors", "Blog Authors", "Manage blog authors.", "blog"],
  ["careers/openings", "Job Openings", "Manage career opportunities.", "careers"],
  ["careers/applications", "Applications", "Review job applications.", "careers"],
  ["media", "Media Library", "Manage images, documents and videos.", "media"],
  ["forms/contact", "Contact Submissions", "Review contact form submissions.", "forms"],
  ["forms/quotes", "Quote Submissions", "Review quote form submissions.", "forms"],
  ["forms/newsletter", "Newsletter", "Manage newsletter subscriptions.", "forms"],
  ["users/roles", "Roles & Permissions", "Manage roles and permission matrix.", "users"],
  ["settings/general", "General Settings", "Company info, logos and contact details.", "settings"],
  ["settings/localization", "Localization", "Manage locale and regional settings.", "settings"],
  ["settings/languages", "Languages", "Manage available languages.", "settings"],
  ["settings/social", "Social Networks", "Manage social media links.", "settings"],
  ["settings/integrations", "Integrations", "Configure third-party integrations.", "settings"],
  ["settings/email-templates", "Email Templates", "Manage email templates.", "settings"],
  ["settings/analytics", "Analytics", "Configure Google Analytics and GTM.", "settings"],
  ["settings/backups", "Backups", "Manage data backups.", "settings"],
  ["audit-logs", "Audit Logs", "Review system activity and changes.", "audit_logs"],
];

const base = "src/app/admin/(dashboard)";

for (const [route, title, desc, mod] of pages) {
  const dir = path.join(base, route);
  fs.mkdirSync(dir, { recursive: true });
  const content = `"use client";

import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Can } from "@/components/admin/permissions/Can";

export default function Page() {
  return (
    <Can module="${mod}" action="view" fallback={<p className="text-sm text-muted-foreground">Access denied.</p>}>
      <AdminPageHeader title="${title}" description="${desc}" />
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          ${title} module — mock data ready for API integration.
        </CardContent>
      </Card>
    </Can>
  );
}
`;
  fs.writeFileSync(path.join(dir, "page.tsx"), content);
}

console.log("Generated", pages.length, "pages");
