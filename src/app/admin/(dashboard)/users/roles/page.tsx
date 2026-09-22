"use client";

import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPermissions } from "@/lib/cms/permissions/matrix";
import type { CmsModule, CmsRole } from "@/lib/cms/types";

const MODULES: CmsModule[] = [
  "dashboard",
  "website",
  "marketplace",
  "global_presence",
  "blog",
  "case_studies",
  "careers",
  "media",
  "forms",
  "users",
  "settings",
  "audit_logs",
];

const MODULE_NAV_KEYS: Partial<Record<CmsModule, string>> = {
  dashboard: "dashboard",
  website: "website",
  marketplace: "marketplace",
  global_presence: "globalPresence",
  blog: "blog",
  case_studies: "caseStudies",
  careers: "careers",
  media: "mediaLibrary",
  forms: "formsLeads",
  users: "users",
  settings: "settings",
  audit_logs: "auditLogs",
  analytics: "analytics",
};

const ROLES: CmsRole[] = [
  "super_admin",
  "admin",
  "content_manager",
  "marketplace_manager",
  "sales_manager",
  "hr_manager",
  "viewer",
];

export default function RolesPage() {
  const t = useTranslations("admin.rolesPage");
  const tNav = useTranslations("admin.nav");

  return (
    <div>
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("matrixTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-2 text-left">{t("module")}</th>
                {ROLES.map((role) => (
                  <th key={role} className="px-2 py-2 text-left font-normal text-muted-foreground">
                    {t(`roleShort.${role}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((mod) => (
                <tr key={mod} className="border-b border-border/40">
                  <td className="px-2 py-2 font-medium">
                    {MODULE_NAV_KEYS[mod] ? tNav(MODULE_NAV_KEYS[mod]!) : mod.replace(/_/g, " ")}
                  </td>
                  {ROLES.map((role) => {
                    const perms = getPermissions(role, mod);
                    return (
                      <td key={role} className="px-2 py-2 text-muted-foreground">
                        {perms.length === 0
                          ? "—"
                          : perms.length >= 5
                            ? t("full")
                            : perms.join(", ")}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
