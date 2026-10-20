"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import {
  EmptyState,
  FilterBar,
  FilterSelect,
  ListSkeleton,
  SearchInput,
  useUrlFilters,
} from "@/components/admin/common";
import { Can } from "@/components/admin/permissions/Can";
import { AccessDenied } from "@/components/admin/permissions/AccessDenied";
import { usePendingApprovalNotice } from "@/components/admin/approvals/use-pending-approval-notice";
import { buttonVariants } from "@/components/ui/button";
import { OpeningsTable } from "@/components/admin/careers/OpeningsTable";
import type { RowAction } from "@/components/admin/careers/OpeningRowActions";
import { CareersApiError, deleteOpening, listOpenings, runOpeningAction } from "@/components/admin/careers/api";
import { OPENING_STATUSES, WORK_MODELS, type JobOpeningWithStats, type OpeningFilters } from "@/lib/cms/careers/types";
import { WORLD_COUNTRIES } from "@/lib/contact/world-countries";

const DEFAULTS = { q: "", status: "", department: "", country: "", workModel: "" };
const TOAST_KEY = {
  duplicate: "duplicated",
  publish: "published",
  close: "closed",
  reopen: "reopened",
  archive: "archived",
} as const;

export default function Page() {
  const t = useTranslations("admin.careers.openings");
  const tCommon = useTranslations("admin.careers.common");
  const tStatus = useTranslations("admin.careers.common.status");
  const tWork = useTranslations("admin.careers.common.workModel");
  const notifyPending = usePendingApprovalNotice();
  const { filters, setFilters, reset } = useUrlFilters(DEFAULTS);
  const [items, setItems] = useState<JobOpeningWithStats[] | null>(null);
  const [error, setError] = useState(false);

  const { q, status, country, workModel } = filters;
  const load = useCallback(async () => {
    try {
      const list = await listOpenings({
        q: q || undefined,
        status: (status || "active") as "active",
        countryCode: country || undefined,
        workModel: (workModel || undefined) as OpeningFilters["workModel"],
      });
      setItems(list);
      setError(false);
    } catch {
      setError(true);
    }
  }, [q, status, country, workModel]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), q ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, q]);

  const departments = useMemo(
    () => [...new Set((items ?? []).map((o) => o.department).filter((d): d is string => Boolean(d)))].sort(),
    [items]
  );
  const visible = useMemo(
    () => (items ?? []).filter((o) => !filters.department || o.department === filters.department),
    [items, filters.department]
  );

  const handleAction = async (action: RowAction, opening: JobOpeningWithStats) => {
    const title = opening.title.en || opening.slug;
    const confirmKey = action === "delete" || action === "archive" || action === "close" ? action : null;
    if (confirmKey && !window.confirm(t(`confirm.${confirmKey}`, { title }))) return;
    try {
      if (action === "delete") {
        const result = await deleteOpening(opening.id);
        if (result.blocked) {
          toast.error(t("toasts.deleteBlocked"));
          return;
        }
        if (!notifyPending(result.payload)) toast.success(t("toasts.deleted"));
      } else {
        const result = await runOpeningAction(action, opening.id);
        if (!notifyPending(result.payload)) toast.success(t(`toasts.${TOAST_KEY[action]}`));
      }
      await load();
    } catch (err) {
      toast.error(err instanceof CareersApiError && err.code === "invalidTransition" ? t("toasts.invalidTransition") : tCommon("saveFailed"));
    }
  };

  const dirty = Object.entries(filters).some(([k, v]) => v !== DEFAULTS[k as keyof typeof DEFAULTS]);

  return (
    <Can module="careers" action="view" fallback={<AccessDenied />}>
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Can module="careers" action="create">
            <Link
              href="/admin/careers/openings/new"
              className={buttonVariants({
                className: "gap-1.5 rounded-full bg-oboya-green text-white hover:bg-oboya-green/90",
              })}
            >
              <Plus className="size-4" />
              {t("newOpening")}
            </Link>
          </Can>
        }
      />
      <div className="space-y-4">
        <FilterBar showReset={dirty} onReset={reset}>
          <SearchInput value={q} onChange={(v) => setFilters({ q: v })} placeholder={t("searchPlaceholder")} />
          <FilterSelect
            label={t("filters.status")}
            value={status}
            onChange={(v) => setFilters({ status: v })}
            allLabel={t("filters.active")}
            options={[
              { value: "all", label: t("filters.all") },
              ...OPENING_STATUSES.map((s) => ({ value: s, label: tStatus(s) })),
            ]}
          />
          <FilterSelect
            label={t("filters.department")}
            value={filters.department}
            onChange={(v) => setFilters({ department: v })}
            options={departments.map((d) => ({ value: d, label: d }))}
          />
          <FilterSelect
            label={t("filters.country")}
            value={country}
            onChange={(v) => setFilters({ country: v })}
            options={WORLD_COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
          />
          <FilterSelect
            label={t("filters.workModel")}
            value={workModel}
            onChange={(v) => setFilters({ workModel: v })}
            options={WORK_MODELS.map((m) => ({ value: m, label: tWork(m) }))}
          />
        </FilterBar>
        {error ? (
          <EmptyState title={tCommon("loadFailed")} />
        ) : items === null ? (
          <ListSkeleton />
        ) : visible.length === 0 ? (
          <EmptyState title={t("empty.title")} description={t("empty.description")} />
        ) : (
          <OpeningsTable items={visible} onAction={(a, o) => void handleAction(a, o)} />
        )}
      </div>
    </Can>
  );
}
