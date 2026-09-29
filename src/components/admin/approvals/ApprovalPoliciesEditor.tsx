"use client";

import { useTranslations } from "next-intl";
import { Switch } from "@/components/ui/switch";
import type { ApprovalPolicy } from "@/lib/cms/approvals/types";
import { CHANGE_TYPES, changeTypeLabelKey } from "@/lib/cms/approvals/change-types";
import type { CmsModule } from "@/lib/cms/types";
import { MODULE_NAV_KEYS } from "@/components/admin/approvals/shared";
import { cn } from "@/lib/utils";

export type PolicyOption = { id: string; label: string };

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((v) => v !== id) : [...list, id];
}

function ChipGroup({
  label,
  options,
  selected,
  onChange,
  lockedIds = [],
  emptyLabel,
}: {
  label: string;
  options: PolicyOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  lockedIds?: string[];
  emptyLabel?: string;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {options.map((option) => {
            const locked = lockedIds.includes(option.id);
            const active = locked || selected.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                disabled={locked}
                aria-pressed={active}
                onClick={() => onChange(toggle(selected, option.id))}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs transition-colors",
                  active
                    ? "border-oboya-blue bg-oboya-blue text-white"
                    : "border-border/70 bg-white text-oboya-blue-dark hover:border-oboya-blue-light",
                  locked && "cursor-not-allowed opacity-80"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ApprovalPoliciesEditor({
  policies,
  roles,
  users,
  onChange,
}: {
  policies: ApprovalPolicy[];
  roles: PolicyOption[];
  users: PolicyOption[];
  onChange: (next: ApprovalPolicy[]) => void;
}) {
  const t = useTranslations("admin.approvals");
  const tNav = useTranslations("admin.nav");

  const update = (changeType: string, patch: Partial<ApprovalPolicy>) => {
    onChange(policies.map((p) => (p.changeType === changeType ? { ...p, ...patch } : p)));
  };

  const modules = Array.from(new Set(CHANGE_TYPES.map((c) => c.module))) as CmsModule[];

  return (
    <div className="space-y-6">
      {modules.map((module) => (
        <section key={module} className="rounded-xl border border-border/60 bg-white">
          <h2 className="border-b border-border/60 px-4 py-3 text-sm font-semibold text-oboya-blue-dark">
            {tNav(MODULE_NAV_KEYS[module] ?? "dashboard")}
          </h2>
          <ul className="divide-y divide-border/50">
            {CHANGE_TYPES.filter((c) => c.module === module).map((changeType) => {
              const policy = policies.find((p) => p.changeType === changeType.id);
              if (!policy) return null;
              return (
                <li key={changeType.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-oboya-blue-dark">
                        {t(`types.${changeTypeLabelKey(changeType.id)}`)}
                        {!changeType.available ? (
                          <span className="ml-2 rounded-full bg-oboya-soft-white px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            {t("policies.comingSoon")}
                          </span>
                        ) : null}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">{changeType.id}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{t("policies.requiresApproval")}</span>
                    <Switch
                      checked={policy.requiresApproval}
                      onCheckedChange={(checked) =>
                        update(changeType.id, { requiresApproval: checked })
                      }
                    />
                  </div>

                  {policy.requiresApproval ? (
                    <div className="mt-3 grid gap-4 rounded-lg bg-oboya-soft-white/60 p-3 lg:grid-cols-3">
                      <ChipGroup
                        label={t("policies.approverRoles")}
                        options={roles}
                        selected={policy.approverRoleIds}
                        lockedIds={["super_admin"]}
                        onChange={(next) => update(changeType.id, { approverRoleIds: next })}
                      />
                      <ChipGroup
                        label={t("policies.approverUsers")}
                        options={users}
                        selected={policy.approverUserIds}
                        emptyLabel={t("policies.noUsers")}
                        onChange={(next) => update(changeType.id, { approverUserIds: next })}
                      />
                      <div className="space-y-3">
                        <ChipGroup
                          label={t("policies.exemptRoles")}
                          options={roles}
                          selected={policy.exemptRoleIds}
                          onChange={(next) => update(changeType.id, { exemptRoleIds: next })}
                        />
                        <label className="flex items-center gap-2 text-xs text-oboya-blue-dark">
                          <Switch
                            checked={policy.requireRejectComment}
                            onCheckedChange={(checked) =>
                              update(changeType.id, { requireRejectComment: checked })
                            }
                          />
                          {t("policies.requireRejectComment")}
                        </label>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <p className="text-xs text-muted-foreground">{t("policies.superAdminNote")}</p>
    </div>
  );
}
