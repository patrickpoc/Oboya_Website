"use client";

import { useTranslations } from "next-intl";
import type { CmsAction, CmsModule, PermissionOverrides } from "@/lib/cms/types";
import {
  CMS_ACTIONS,
  CMS_MODULES,
} from "@/lib/cms/permissions/access-types";
import { cn } from "@/lib/utils";

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

type UserOverridesEditorProps = {
  overrides: PermissionOverrides;
  disabled?: boolean;
  onChange: (next: PermissionOverrides) => void;
};

function toggleInList(
  list: CmsAction[] | undefined,
  action: CmsAction
): CmsAction[] {
  const current = list ?? [];
  return current.includes(action)
    ? current.filter((a) => a !== action)
    : [...current, action];
}

export function UserOverridesEditor({
  overrides,
  disabled,
  onChange,
}: UserOverridesEditorProps) {
  const t = useTranslations("admin.accessControl");
  const tNav = useTranslations("admin.nav");

  const setGrant = (module: CmsModule, action: CmsAction) => {
    if (disabled) return;
    const grants = { ...(overrides.grants ?? {}) };
    const next = toggleInList(grants[module], action);
    if (next.length === 0) delete grants[module];
    else grants[module] = next;
    // Remove from denies if granting
    const denies = { ...(overrides.denies ?? {}) };
    if (denies[module]) {
      denies[module] = denies[module]!.filter((a) => a !== action);
      if (denies[module]!.length === 0) delete denies[module];
    }
    onChange({ grants, denies });
  };

  const setDeny = (module: CmsModule, action: CmsAction) => {
    if (disabled) return;
    const denies = { ...(overrides.denies ?? {}) };
    const next = toggleInList(denies[module], action);
    if (next.length === 0) delete denies[module];
    else denies[module] = next;
    const grants = { ...(overrides.grants ?? {}) };
    if (grants[module]) {
      grants[module] = grants[module]!.filter((a) => a !== action);
      if (grants[module]!.length === 0) delete grants[module];
    }
    onChange({ grants, denies });
  };

  return (
    <div className="overflow-x-auto">
      <p className="mb-3 text-xs text-muted-foreground">{t("overridesHelp")}</p>
      <table className="w-full min-w-[720px] text-xs">
        <thead>
          <tr className="border-b border-border/60">
            <th className="px-2 py-2 text-left font-medium text-oboya-blue-dark">
              {t("module")}
            </th>
            {CMS_ACTIONS.map((action) => (
              <th
                key={action}
                className="px-2 py-2 text-center font-normal text-muted-foreground"
                colSpan={2}
              >
                {t(`actions.${action}`)}
              </th>
            ))}
          </tr>
          <tr className="border-b border-border/40 text-[10px] uppercase tracking-wide text-muted-foreground">
            <th />
            {CMS_ACTIONS.map((action) => (
              <th key={action} colSpan={2} className="px-1 py-1">
                <div className="flex justify-center gap-3">
                  <span className="text-oboya-green">{t("grant")}</span>
                  <span className="text-oboya-orange">{t("deny")}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CMS_MODULES.map((mod) => (
            <tr key={mod} className="border-b border-border/40">
              <td className="px-2 py-2 font-medium text-oboya-blue-dark">
                {MODULE_NAV_KEYS[mod]
                  ? tNav(MODULE_NAV_KEYS[mod]!)
                  : mod.replace(/_/g, " ")}
              </td>
              {CMS_ACTIONS.map((action) => {
                const granted = Boolean(
                  overrides.grants?.[mod]?.includes(action)
                );
                const denied = Boolean(
                  overrides.denies?.[mod]?.includes(action)
                );
                return (
                  <td key={action} colSpan={2} className="px-1 py-2">
                    <div className="flex justify-center gap-3">
                      <input
                        type="checkbox"
                        className={cn(
                          "size-3.5 accent-[var(--oboya-green)]",
                          disabled && "opacity-50"
                        )}
                        checked={granted}
                        disabled={disabled}
                        onChange={() => setGrant(mod, action)}
                        aria-label={`grant ${mod} ${action}`}
                      />
                      <input
                        type="checkbox"
                        className={cn(
                          "size-3.5 accent-[var(--oboya-orange)]",
                          disabled && "opacity-50"
                        )}
                        checked={denied}
                        disabled={disabled}
                        onChange={() => setDeny(mod, action)}
                        aria-label={`deny ${mod} ${action}`}
                      />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
