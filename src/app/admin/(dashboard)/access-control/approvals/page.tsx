"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ApprovalPoliciesEditor,
  type PolicyOption,
} from "@/components/admin/approvals/ApprovalPoliciesEditor";
import { ChangeRequestList } from "@/components/admin/approvals/ChangeRequestList";
import { MODULE_NAV_KEYS } from "@/components/admin/approvals/shared";
import type { ApprovalPoliciesDoc, ApprovalPolicy } from "@/lib/cms/approvals/types";
import { CHANGE_REQUEST_STATUSES } from "@/lib/cms/approvals/types";
import type { AccessControlDoc } from "@/lib/cms/permissions/access-types";
import type { CmsUser } from "@/lib/cms/types";

const REQUEST_MODULES = ["marketplace", "website", "blog", "case_studies", "careers"] as const;

async function fetchApprovalSettings(): Promise<{
  policies: ApprovalPolicy[];
  roles: PolicyOption[];
  users: PolicyOption[];
}> {
  const [policiesRes, accessRes, usersRes] = await Promise.all([
    fetch("/api/cms/approvals/policies", { cache: "no-store" }),
    fetch("/api/cms/access-control", { cache: "no-store" }),
    fetch("/api/cms/access-control/users", { cache: "no-store" }),
  ]);
  const policiesDoc = (await policiesRes.json()) as ApprovalPoliciesDoc & { error?: string };
  if (!policiesRes.ok) throw new Error(policiesDoc.error || "Failed to load approval policies");

  let roles: PolicyOption[] = [];
  if (accessRes.ok) {
    const access = (await accessRes.json()) as AccessControlDoc;
    roles = access.roles
      .filter((r) => r.active)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((r) => ({ id: r.id, label: r.label }));
  }
  let users: PolicyOption[] = [];
  if (usersRes.ok) {
    const data = (await usersRes.json()) as { users?: CmsUser[] };
    users = (data.users ?? [])
      .filter((u) => u.status === "active")
      .map((u) => ({ id: u.id, label: u.name || u.email }));
  }
  return { policies: policiesDoc.policies, roles, users };
}

export default function ApprovalsSettingsPage() {
  const t = useTranslations("admin.approvals");
  const tNav = useTranslations("admin.nav");
  const tCommon = useTranslations("admin.common");
  const [policies, setPolicies] = useState<ApprovalPolicy[] | null>(null);
  const [roles, setRoles] = useState<PolicyOption[]>([]);
  const [users, setUsers] = useState<PolicyOption[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("policies");
  const [statusFilter, setStatusFilter] = useState("open");
  const [moduleFilter, setModuleFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchApprovalSettings()
      .then((result) => {
        if (cancelled) return;
        setPolicies(result.policies);
        setRoles(result.roles);
        setUsers(result.users);
        setDirty(false);
      })
      .catch((error: unknown) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : t("loadFailed"));
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const handleSave = async () => {
    if (!policies) return;
    setSaving(true);
    try {
      const res = await fetch("/api/cms/approvals/policies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policies }),
      });
      const data = (await res.json()) as ApprovalPoliciesDoc & { error?: string };
      if (!res.ok) throw new Error(data.error || t("policies.saveFailed"));
      setPolicies(data.policies);
      setDirty(false);
      toast.success(t("policies.saved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("policies.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title={t("policies.title")}
        description={t("policies.description")}
        actions={
          tab === "policies" ? (
            <Button
              type="button"
              className="rounded-full bg-oboya-blue text-white hover:bg-oboya-blue/90"
              disabled={!dirty || saving}
              onClick={() => void handleSave()}
            >
              {saving ? tCommon("saving") : tCommon("save")}
            </Button>
          ) : null
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="policies">{t("policies.tabPolicies")}</TabsTrigger>
          <TabsTrigger value="requests">{t("policies.tabRequests")}</TabsTrigger>
        </TabsList>

        <TabsContent value="policies">
          {policies ? (
            <ApprovalPoliciesEditor
              policies={policies}
              roles={roles}
              users={users}
              onChange={(next) => {
                setPolicies(next);
                setDirty(true);
              }}
            />
          ) : (
            <div className="min-h-[40vh]" aria-hidden />
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              {t("filters.status")}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 rounded-md border border-border/70 bg-white px-2 text-xs text-oboya-blue-dark"
              >
                <option value="open">{t("filters.open")}</option>
                <option value="">{tCommon("all")}</option>
                {CHANGE_REQUEST_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {t(`status.${status}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              {t("filters.module")}
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="h-8 rounded-md border border-border/70 bg-white px-2 text-xs text-oboya-blue-dark"
              >
                <option value="">{tCommon("all")}</option>
                {REQUEST_MODULES.map((module) => (
                  <option key={module} value={module}>
                    {tNav(MODULE_NAV_KEYS[module] ?? module)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <ChangeRequestList
            key={`${statusFilter}-${moduleFilter}`}
            mode="all"
            status={statusFilter}
            module={moduleFilter || undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
