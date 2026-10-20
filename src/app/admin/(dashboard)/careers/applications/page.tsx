"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import {
  EmptyState,
  FilterBar,
  FilterSelect,
  FilterTabs,
  ListSkeleton,
  SearchInput,
  useUrlFilters,
} from "@/components/admin/common";
import { Can } from "@/components/admin/permissions/Can";
import { AccessDenied } from "@/components/admin/permissions/AccessDenied";
import { buttonVariants } from "@/components/ui/button";
import { ApplicationsTable } from "@/components/admin/careers/ApplicationsTable";
import { applicationsExportUrl, listApplications, listOpenings } from "@/components/admin/careers/api";
import { countByPipelineStatus } from "@/lib/cms/careers/filters";
import {
  APPLICATION_SOURCES,
  PIPELINE_STATUSES,
  type ApplicationFilters,
  type JobApplication,
  type JobOpening,
} from "@/lib/cms/careers/types";

const DEFAULTS = { q: "", opening: "", status: "", source: "" };

export default function Page() {
  const t = useTranslations("admin.careers.applications");
  const tCommon = useTranslations("admin.careers.common");
  const tPipe = useTranslations("admin.careers.common.pipeline");
  const tSource = useTranslations("admin.careers.common.source");
  const { filters, setFilters, reset } = useUrlFilters(DEFAULTS);
  const [items, setItems] = useState<JobApplication[] | null>(null);
  const [openings, setOpenings] = useState<JobOpening[]>([]);
  const [error, setError] = useState(false);

  const { q, opening, status, source } = filters;

  useEffect(() => {
    listOpenings({ status: "all" })
      .then(setOpenings)
      .catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    try {
      setItems(
        await listApplications({
          q: q || undefined,
          openingId: opening || undefined,
          source: (source || undefined) as ApplicationFilters["source"],
        })
      );
      setError(false);
    } catch {
      setError(true);
    }
  }, [q, opening, source]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), q ? 250 : 0);
    return () => clearTimeout(timer);
  }, [load, q]);

  const counts = useMemo(() => countByPipelineStatus(items ?? []), [items]);
  const visible = useMemo(
    () => (items ?? []).filter((a) => !status || a.status === status),
    [items, status]
  );
  const openingTitles = useMemo(
    () => Object.fromEntries(openings.map((o) => [o.id, o.title.en || o.slug])),
    [openings]
  );
  const dirty = Object.entries(filters).some(([k, v]) => v !== DEFAULTS[k as keyof typeof DEFAULTS]);
  const exportUrl = applicationsExportUrl({
    q: q || undefined,
    openingId: opening || undefined,
    status: (status || undefined) as ApplicationFilters["status"],
    source: (source || undefined) as ApplicationFilters["source"],
  });
  const btn = buttonVariants({ variant: "outline", className: "gap-1.5 rounded-full" });

  return (
    <Can module="careers" action="edit" fallback={<AccessDenied />}>
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <a href={exportUrl} download className={btn}>
              <Download className="size-4" />
              {t("exportCsv")}
            </a>
          </>
        }
      />
      <div className="min-w-0 space-y-6">
        <section aria-label={t("filters.allStatuses")} className="min-w-0 space-y-4 rounded-xl border border-border/60 bg-white p-4 sm:p-5">
        <FilterTabs
          className="w-full [&_button]:min-h-9"
          value={status}
          onChange={(v) => setFilters({ status: v })}
          options={[
            { value: "", label: t("filters.allStatuses"), count: counts.total },
            ...PIPELINE_STATUSES.map((s) => ({ value: s, label: tPipe(s), count: counts[s] })),
          ]}
        />
        <FilterBar className="[&_label]:min-w-0 [&_label]:flex-1 [&_label]:flex-col [&_label]:items-start [&_label]:gap-2 [&_select]:h-10 [&_select]:w-full [&_select]:max-w-none [&>div]:gap-4" showReset={dirty} onReset={reset}>
          <SearchInput className="self-end sm:max-w-none sm:flex-[2] [&_input]:h-10" value={q} onChange={(v) => setFilters({ q: v })} placeholder={t("searchPlaceholder")} />
          <FilterSelect
            label={t("filters.opening")}
            value={opening}
            onChange={(v) => setFilters({ opening: v })}
            allLabel={t("filters.allOpenings")}
            options={[
              { value: "talent_pool", label: t("filters.talentPool") },
              ...openings.map((o) => ({ value: o.id, label: o.title.en || o.slug })),
            ]}
          />
          <FilterSelect
            label={t("filters.source")}
            value={source}
            onChange={(v) => setFilters({ source: v })}
            allLabel={t("filters.allSources")}
            options={APPLICATION_SOURCES.map((s) => ({ value: s, label: tSource(s) }))}
          />
        </FilterBar>
        </section>
        {items && !error ? <p className="text-sm text-muted-foreground" role="status">{t("resultCount", { count: visible.length })}</p> : null}
        {error ? (
          <EmptyState title={tCommon("loadFailed")} />
        ) : items === null ? (
          <ListSkeleton />
        ) : visible.length === 0 ? (
          <EmptyState title={dirty ? t("empty.filteredTitle") : t("empty.title")} description={dirty ? t("empty.filteredDescription") : t("empty.description")} />
        ) : (
          <ApplicationsTable items={visible} openingTitles={openingTitles} />
        )}
      </div>
    </Can>
  );
}
