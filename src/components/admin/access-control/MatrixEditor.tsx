"use client";

import { useTranslations } from "next-intl";
import type { CmsAction, CmsModule, PermissionLevel } from "@/lib/cms/types";
import {
  CMS_ACTIONS,
  CMS_MODULES,
  FULL_ACTIONS,
} from "@/lib/cms/permissions/access-types";
import type { AccessMatrix } from "@/lib/cms/permissions/access-types";
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

type MatrixEditorProps = {
  roleId: string;
  locked: boolean;
  matrix: AccessMatrix;
  onChange: (module: CmsModule, level: PermissionLevel) => void;
};

function normalize(level: PermissionLevel | undefined): CmsAction[] {
  if (!level || level === "none") return [];
  if (level === "full") return [...FULL_ACTIONS];
  return level;
}

export function MatrixEditor({
  roleId,
  locked,
  matrix,
  onChange,
}: MatrixEditorProps) {
  const t = useTranslations("admin.accessControl");
  const tNav = useTranslations("admin.nav");
  const row = matrix[roleId] ?? {};

  const toggleAction = (module: CmsModule, action: CmsAction) => {
    if (locked) return;
    const current = normalize(row[module]);
    const next = current.includes(action)
      ? current.filter((a) => a !== action)
      : [...current, action];
    if (next.length === 0) onChange(module, "none");
    else if (next.length === FULL_ACTIONS.length) onChange(module, "full");
    else onChange(module, next);
  };

  const setFull = (module: CmsModule) => {
    if (locked) return;
    onChange(module, "full");
  };

  const setNone = (module: CmsModule) => {
    if (locked) return;
    onChange(module, "none");
  };

  return (
    <div className="overflow-x-auto">
      {locked ? (
        <p className="mb-3 text-xs text-muted-foreground">{t("superAdminLocked")}</p>
      ) : null}
      <table className="w-full min-w-[640px] text-xs">
        <thead>
          <tr className="border-b border-border/60">
            <th className="px-2 py-2 text-left font-medium text-oboya-blue-dark">
              {t("module")}
            </th>
            {CMS_ACTIONS.map((action) => (
              <th
                key={action}
                className="px-2 py-2 text-center font-normal text-muted-foreground"
              >
                {t(`actions.${action}`)}
              </th>
            ))}
            <th className="px-2 py-2 text-right font-normal text-muted-foreground">
              {t("presets")}
            </th>
          </tr>
        </thead>
        <tbody>
          {CMS_MODULES.map((mod) => {
            const actions = normalize(row[mod]);
            return (
              <tr key={mod} className="border-b border-border/40">
                <td className="px-2 py-2 font-medium text-oboya-blue-dark">
                  {MODULE_NAV_KEYS[mod]
                    ? tNav(MODULE_NAV_KEYS[mod]!)
                    : mod.replace(/_/g, " ")}
                </td>
                {CMS_ACTIONS.map((action) => {
                  const checked = actions.includes(action);
                  return (
                    <td key={action} className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        className="size-3.5 accent-[var(--oboya-blue)]"
                        checked={checked}
                        disabled={locked}
                        onChange={() => toggleAction(mod, action)}
                        aria-label={`${mod} ${action}`}
                      />
                    </td>
                  );
                })}
                <td className="px-2 py-2 text-right">
                  <div className="inline-flex gap-1">
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => setFull(mod)}
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide",
                        locked
                          ? "text-muted-foreground"
                          : "text-oboya-blue hover:bg-oboya-blue/10"
                      )}
                    >
                      {t("full")}
                    </button>
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => setNone(mod)}
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide",
                        locked
                          ? "text-muted-foreground"
                          : "text-oboya-orange hover:bg-oboya-orange/10"
                      )}
                    >
                      {t("none")}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
