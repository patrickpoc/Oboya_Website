"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { useAdmin } from "@/contexts/AdminContext";
import { getPermissions } from "@/lib/cms/permissions/matrix";
import { getActiveRoles } from "@/lib/cms/permissions/access-store";
import type { CmsModule } from "@/lib/cms/types";
import { SYSTEM_ROLE_IDS } from "@/lib/cms/types";

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

export default function RolesPage() {
  const t = useTranslations("admin.rolesPage");
  const tNav = useTranslations("admin.nav");
  const tAccess = useTranslations("admin.accessControl");
  const { user, accessHydrated } = useAdmin();
  const isSuperAdmin = user.role === "super_admin";

  const roles =
    accessHydrated && getActiveRoles().length > 0
      ? getActiveRoles()
      : SYSTEM_ROLE_IDS.map((id) => ({ id, label: id }));

  return (
    <div>
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        actions={
          isSuperAdmin ? (
            <Link
              href="/admin/access-control"
              className={buttonVariants({
                variant: "outline",
                className: "rounded-full",
              })}
            >
              {tAccess("editInAccessControl")}
            </Link>
          ) : null
        }
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
                {roles.map((role) => (
                  <th
                    key={role.id}
                    className="px-2 py-2 text-left font-normal text-muted-foreground"
                  >
                    {(SYSTEM_ROLE_IDS as readonly string[]).includes(role.id)
                      ? t(`roleShort.${role.id}`)
                      : role.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((mod) => (
                <tr key={mod} className="border-b border-border/40">
                  <td className="px-2 py-2 font-medium">
                    {MODULE_NAV_KEYS[mod]
                      ? tNav(MODULE_NAV_KEYS[mod]!)
                      : mod.replace(/_/g, " ")}
                  </td>
                  {roles.map((role) => {
                    const perms = getPermissions(role.id, mod);
                    return (
                      <td
                        key={role.id}
                        className="px-2 py-2 text-muted-foreground"
                      >
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
