"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdmin } from "@/contexts/AdminContext";
import { getPermissions } from "@/lib/cms/permissions/matrix";
import { getActiveRoles } from "@/lib/cms/permissions/access-store";
import { ROLE_TIERS, roleTier, type RoleTier } from "@/lib/cms/permissions/defaults";
import type { CmsAction, CmsModule } from "@/lib/cms/types";
import { SYSTEM_ROLE_IDS } from "@/lib/cms/types";
import { cn } from "@/lib/utils";

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

type Level = "full" | "publish" | "edit" | "view" | "none" | "custom";

const LEVELS: Level[] = ["full", "publish", "edit", "view", "custom", "none"];

const LEVEL_CLASSES: Record<Level, string> = {
  full: "bg-oboya-green text-white",
  publish: "bg-oboya-blue text-white",
  edit: "bg-oboya-blue-light/15 text-oboya-blue ring-1 ring-inset ring-oboya-blue-light/40",
  view: "bg-oboya-soft-white text-oboya-blue-dark/70 ring-1 ring-inset ring-border/70",
  custom: "bg-oboya-yellow-light/60 text-oboya-blue-dark",
  none: "text-muted-foreground/60",
};

const TIER_ACCENT: Record<RoleTier, string> = {
  platform: "border-oboya-blue-dark",
  c_level: "border-oboya-orange",
  manager: "border-oboya-green",
  analyst: "border-oboya-blue-light",
  custom: "border-oboya-yellow-dark",
};

function levelFor(actions: CmsAction[]): Level {
  const has = (a: CmsAction) => actions.includes(a);
  if (actions.length === 0) return "none";
  if (actions.length >= 5) return "full";
  if (actions.length === 1 && has("view")) return "view";
  if (actions.length === 4 && !has("delete")) return "publish";
  if (actions.length === 3 && has("view") && has("create") && has("edit")) return "edit";
  return "custom";
}

type FilterValue = "all" | RoleTier;

export default function RolesPage() {
  const t = useTranslations("admin.rolesPage");
  const tNav = useTranslations("admin.nav");
  const tAccess = useTranslations("admin.accessControl");
  const { user, accessHydrated } = useAdmin();
  const isSuperAdmin = user.role === "super_admin";
  const [filter, setFilter] = useState<FilterValue>("all");

  const roles =
    accessHydrated && getActiveRoles().length > 0
      ? getActiveRoles()
      : SYSTEM_ROLE_IDS.map((id) => ({ id, label: id }));

  const groups = useMemo(
    () =>
      ROLE_TIERS.map((tier) => ({
        tier,
        roles: roles.filter((role) => roleTier(role.id) === tier),
      })).filter((group) => group.roles.length > 0 && (filter === "all" || group.tier === filter)),
    [roles, filter]
  );

  const availableTiers = ROLE_TIERS.filter((tier) =>
    roles.some((role) => roleTier(role.id) === tier)
  );

  const roleName = (role: { id: string; label: string }) =>
    (SYSTEM_ROLE_IDS as readonly string[]).includes(role.id)
      ? t(`roleShort.${role.id}`)
      : role.label;

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

      <section className="rounded-xl border border-border/60 bg-white">
        <div className="flex flex-col gap-3 border-b border-border/60 p-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-oboya-blue-dark">{t("matrixTitle")}</h2>
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
              {LEVELS.map((level) => (
                <li key={level} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span
                    className={cn(
                      "inline-flex min-w-11 justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      LEVEL_CLASSES[level]
                    )}
                  >
                    {t(`levels.${level}`)}
                  </span>
                  {t(`levelHints.${level}`)}
                </li>
              ))}
            </ul>
          </div>
          <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterValue)}>
            <TabsList className="w-fit max-w-full overflow-x-auto">
              <TabsTrigger value="all">{t("tiers.all")}</TabsTrigger>
              {availableTiers.map((tier) => (
                <TabsTrigger key={tier} value={tier}>
                  {t(`tiers.${tier}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full border-separate border-spacing-0 text-xs">
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  className="sticky top-0 left-0 z-30 min-w-40 border-b border-border/60 bg-white px-4 py-2 text-left align-bottom font-semibold text-oboya-blue-dark"
                >
                  {t("module")}
                </th>
                {groups.map((group) => (
                  <th
                    key={group.tier}
                    colSpan={group.roles.length}
                    className="sticky top-0 z-20 h-8 border-l border-border/60 bg-white px-2 pt-2 text-left"
                  >
                    <span
                      className={cn(
                        "block border-t-2 pt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground",
                        TIER_ACCENT[group.tier]
                      )}
                    >
                      {t(`tiers.${group.tier}`)}
                    </span>
                  </th>
                ))}
              </tr>
              <tr>
                {groups.flatMap((group) =>
                  group.roles.map((role, index) => (
                    <th
                      key={role.id}
                      title={role.label}
                      className={cn(
                        "sticky top-8 z-20 min-w-20 border-b border-border/60 bg-white px-2 py-2 text-center font-medium whitespace-nowrap text-oboya-blue-dark",
                        index === 0 && "border-l"
                      )}
                    >
                      {roleName(role)}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((mod) => (
                <tr key={mod} className="group">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-b border-border/40 bg-white px-4 py-2.5 text-left font-medium whitespace-nowrap text-oboya-blue-dark group-hover:bg-oboya-soft-white"
                  >
                    {MODULE_NAV_KEYS[mod] ? tNav(MODULE_NAV_KEYS[mod]!) : mod.replace(/_/g, " ")}
                  </th>
                  {groups.flatMap((group) =>
                    group.roles.map((role, index) => {
                      const actions = getPermissions(role.id, mod);
                      const level = levelFor(actions);
                      const tooltip =
                        actions.length > 0
                          ? actions.map((a) => tAccess(`actions.${a}`)).join(", ")
                          : t("levels.none");
                      return (
                        <td
                          key={role.id}
                          className={cn(
                            "border-b border-border/40 px-2 py-2.5 text-center group-hover:bg-oboya-soft-white",
                            index === 0 && "border-l border-l-border/60"
                          )}
                        >
                          <span
                            title={`${roleName(role)} · ${tooltip}`}
                            className={cn(
                              "inline-flex min-w-14 justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              LEVEL_CLASSES[level]
                            )}
                          >
                            {level === "none" ? "—" : t(`levels.${level}`)}
                          </span>
                        </td>
                      );
                    })
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
