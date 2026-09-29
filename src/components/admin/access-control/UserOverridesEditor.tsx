"use client";

import { useTranslations } from "next-intl";
import { Check, Minus, Plus, X } from "lucide-react";
import type {
  CmsAction,
  CmsModule,
  PermissionLevel,
  PermissionOverrides,
} from "@/lib/cms/types";
import { CMS_ACTIONS, CMS_MODULES, FULL_ACTIONS } from "@/lib/cms/permissions/access-types";
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

type CellState = "allowed" | "blocked" | "granted" | "denied";

const CELL_CLASSES: Record<CellState, string> = {
  allowed: "bg-oboya-green/10 text-oboya-green ring-1 ring-inset ring-oboya-green/25",
  blocked: "bg-transparent text-muted-foreground/40 ring-1 ring-inset ring-border/60",
  granted: "bg-oboya-green text-white shadow-sm",
  denied: "bg-oboya-orange text-white shadow-sm",
};

const CELL_ICONS: Record<CellState, typeof Check> = {
  allowed: Check,
  blocked: Minus,
  granted: Plus,
  denied: X,
};

export function levelToActions(level: PermissionLevel | undefined): CmsAction[] {
  if (!level || level === "none") return [];
  if (level === "full") return [...FULL_ACTIONS];
  return level;
}

export function countOverrides(overrides: PermissionOverrides | undefined): number {
  const count = (map?: Partial<Record<CmsModule, CmsAction[]>>) =>
    Object.values(map ?? {}).reduce((sum, list) => sum + (list?.length ?? 0), 0);
  return count(overrides?.grants) + count(overrides?.denies);
}

function without(
  map: Partial<Record<CmsModule, CmsAction[]>> | undefined,
  module: CmsModule,
  action: CmsAction
) {
  const next = { ...(map ?? {}) };
  const list = (next[module] ?? []).filter((a) => a !== action);
  if (list.length === 0) delete next[module];
  else next[module] = list;
  return next;
}

function withAction(
  map: Partial<Record<CmsModule, CmsAction[]>> | undefined,
  module: CmsModule,
  action: CmsAction
) {
  const next = { ...(map ?? {}) };
  next[module] = [...(next[module] ?? []).filter((a) => a !== action), action];
  return next;
}

type UserOverridesEditorProps = {
  overrides: PermissionOverrides;
  roleLevels: Partial<Record<CmsModule, PermissionLevel>>;
  disabled?: boolean;
  onChange: (next: PermissionOverrides) => void;
};

export function UserOverridesEditor({
  overrides,
  roleLevels,
  disabled,
  onChange,
}: UserOverridesEditorProps) {
  const t = useTranslations("admin.accessControl");
  const tNav = useTranslations("admin.nav");

  const stateFor = (module: CmsModule, action: CmsAction): CellState => {
    if (overrides.denies?.[module]?.includes(action)) return "denied";
    if (overrides.grants?.[module]?.includes(action)) return "granted";
    return levelToActions(roleLevels[module]).includes(action) ? "allowed" : "blocked";
  };

  /** Click flips between the role default and its opposite; overrides that match the role are dropped. */
  const toggle = (module: CmsModule, action: CmsAction) => {
    if (disabled) return;
    const state = stateFor(module, action);
    const grants = without(overrides.grants, module, action);
    const denies = without(overrides.denies, module, action);
    if (state === "allowed") onChange({ grants, denies: withAction(denies, module, action) });
    else if (state === "blocked") onChange({ grants: withAction(grants, module, action), denies });
    else onChange({ grants, denies });
  };

  const tipFor = (state: CellState) =>
    ({
      allowed: `${t("tipAllowedByRole")} · ${t("clickToDeny")}`,
      blocked: `${t("tipBlockedByRole")} · ${t("clickToGrant")}`,
      granted: `${t("tipGranted")} · ${t("clickToReset")}`,
      denied: `${t("tipDenied")} · ${t("clickToReset")}`,
    })[state];

  return (
    <div className="space-y-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
        {(["allowed", "blocked", "granted", "denied"] as CellState[]).map((state) => {
          const Icon = CELL_ICONS[state];
          return (
            <li key={state} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex size-5 items-center justify-center rounded-md",
                  CELL_CLASSES[state]
                )}
              >
                <Icon className="size-3" strokeWidth={2.5} />
              </span>
              {t(`legend.${state}`)}
            </li>
          );
        })}
      </ul>

      <div className="overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full border-separate border-spacing-0 text-xs">
          <thead>
            <tr className="bg-oboya-soft-white">
              <th className="sticky left-0 z-10 min-w-36 border-b border-border/60 bg-oboya-soft-white px-3 py-2 text-left font-semibold text-oboya-blue-dark">
                {t("module")}
              </th>
              {CMS_ACTIONS.map((action) => (
                <th
                  key={action}
                  className="min-w-16 border-b border-border/60 px-2 py-2 text-center font-medium text-muted-foreground"
                >
                  {t(`actions.${action}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CMS_MODULES.map((mod) => {
              const moduleOverrides =
                (overrides.grants?.[mod]?.length ?? 0) + (overrides.denies?.[mod]?.length ?? 0);
              return (
                <tr key={mod} className="group">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-b border-border/40 bg-white px-3 py-1.5 text-left font-medium whitespace-nowrap text-oboya-blue-dark group-hover:bg-oboya-soft-white"
                  >
                    <span className="flex items-center gap-2">
                      {MODULE_NAV_KEYS[mod] ? tNav(MODULE_NAV_KEYS[mod]!) : mod.replace(/_/g, " ")}
                      {moduleOverrides > 0 ? (
                        <span className="size-1.5 rounded-full bg-oboya-orange" aria-hidden />
                      ) : null}
                    </span>
                  </th>
                  {CMS_ACTIONS.map((action) => {
                    const state = stateFor(mod, action);
                    const Icon = CELL_ICONS[state];
                    return (
                      <td
                        key={action}
                        className="border-b border-border/40 px-2 py-1.5 text-center group-hover:bg-oboya-soft-white"
                      >
                        <button
                          type="button"
                          disabled={disabled}
                          title={tipFor(state)}
                          aria-label={`${mod} ${action}: ${t(`legend.${state}`)}`}
                          onClick={() => toggle(mod, action)}
                          className={cn(
                            "inline-flex size-7 items-center justify-center rounded-md transition-all",
                            CELL_CLASSES[state],
                            disabled
                              ? "cursor-not-allowed opacity-50"
                              : "hover:scale-105 hover:ring-2 hover:ring-oboya-blue-light/50"
                          )}
                        >
                          <Icon className="size-3.5" strokeWidth={2.5} />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground">{t("overridesHelp")}</p>
    </div>
  );
}
