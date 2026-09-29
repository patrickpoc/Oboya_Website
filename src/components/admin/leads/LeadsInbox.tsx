"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Link from "next/link";
import { ChevronRight, Inbox } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table/DataTable";
import { FormDrawer } from "@/components/admin/forms/FormDrawer";
import {
  EmptyState,
  ErrorState,
  FilterBar,
  FilterSelect,
  FilterTabs,
  SearchInput,
  useUrlFilters,
} from "@/components/admin/common";
import { LeadDetail, type StaffOption } from "@/components/admin/leads/LeadDetail";
import { LeadPriorityPill, LeadStatusPill } from "@/components/admin/leads/pills";
import { emitLeadsChanged } from "@/components/admin/leads/use-lead-counts";
import { Button } from "@/components/ui/button";
import { Can } from "@/components/admin/permissions/Can";
import { AccessDenied } from "@/components/admin/permissions/AccessDenied";
import { useAdmin } from "@/contexts/AdminContext";
import type { FormActivity, FormSubmission, FormSubmissionStatus } from "@/lib/cms/types";
import {
  FORM_PRIORITIES,
  FORM_SUBMISSION_STATUSES,
} from "@/lib/cms/types";
import {
  countByStatus,
  isUnread,
  leadCompany,
  leadCountry,
  leadEmail,
  leadName,
  leadSlaState,
} from "@/lib/cms/forms/crm";
import { formatShopPrice } from "@/lib/shop/format-price";
import { cn } from "@/lib/utils";

const PAGE_LIMIT = 50;

export function LeadsInbox({
  type,
  title,
  description,
}: {
  type: "contact" | "quote";
  title: string;
  description: string;
}) {
  const t = useTranslations("admin.leads");
  const tCommon = useTranslations("admin.common");
  const { can } = useAdmin();
  const { filters, setFilters, reset } = useUrlFilters({
    status: "open",
    q: "",
    country: "",
    assignee: "",
    tag: "",
    priority: "",
    from: "",
    to: "",
  });
  const [rows, setRows] = useState<FormSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<FormSubmission | null>(null);
  const [related, setRelated] = useState<FormSubmission[]>([]);
  const [activities, setActivities] = useState<FormActivity[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [counts, setCounts] = useState(countByStatus([]));
  const [refreshKey, setRefreshKey] = useState(0);

  const query = useMemo(() => {
    const params = new URLSearchParams({ type, limit: String(PAGE_LIMIT) });
    if (filters.status) params.set("status", filters.status);
    if (filters.q) params.set("q", filters.q);
    if (filters.assignee) params.set("assignee", filters.assignee);
    if (filters.tag) params.set("tag", filters.tag);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    return params;
  }, [filters, type]);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const params = new URLSearchParams(query);
        params.set("page", "1");
        const res = await fetch(`/api/cms/forms?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(t("loadFailed"));
        const data = (await res.json()) as { items?: FormSubmission[]; total?: number };
        const items = Array.isArray(data.items) ? data.items : [];
        setTotal(Number(data.total) || items.length);
        setPage(1);
        setRows(items);
        setError(null);
        const allRes = await fetch(`/api/cms/forms?type=${type}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (allRes.ok) {
          const all = (await allRes.json()) as FormSubmission[];
          if (Array.isArray(all)) setCounts(countByStatus(all));
        }
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
        setError(err instanceof Error ? err.message : t("loadFailed"));
        setRows([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [query, t, type, refreshKey]);

  const loadMore = async () => {
    const params = new URLSearchParams(query);
    params.set("page", String(page + 1));
    const res = await fetch(`/api/cms/forms?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { items?: FormSubmission[]; total?: number };
    const items = Array.isArray(data.items) ? data.items : [];
    setTotal(Number(data.total) || items.length);
    setPage((p) => p + 1);
    setRows((prev) => [...prev, ...items]);
  };

  useEffect(() => {
    void fetch("/api/cms/forms/assignees", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { users?: StaffOption[] }) => setStaff(data.users ?? []))
      .catch(() => undefined);
  }, []);

  const countryOptions = useMemo(() => {
    const set = new Set(rows.map(leadCountry).filter(Boolean));
    return [...set].sort().map((value) => ({ value, label: value }));
  }, [rows]);

  const tagOptions = useMemo(() => {
    const set = new Set(rows.flatMap((row) => row.tags ?? []));
    return [...set].sort().map((value) => ({ value, label: value }));
  }, [rows]);

  const visible = useMemo(() => {
    return rows.filter((row) => {
      if (filters.country && leadCountry(row) !== filters.country) return false;
      if (filters.priority && (row.priority ?? "normal") !== filters.priority) return false;
      return true;
    });
  }, [rows, filters.country, filters.priority]);

  const openDrawer = async (row: FormSubmission) => {
    setSelected(row);
    if (isUnread(row) && can("forms", "edit")) {
      void fetch("/api/cms/forms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, read: true, status: row.status === "new" ? "in_progress" : row.status }),
      }).then(async (res) => {
        if (!res.ok) return;
        const next = (await res.json()) as FormSubmission;
        setRows((prev) => prev.map((s) => (s.id === next.id ? next : s)));
        setSelected(next);
        emitLeadsChanged();
      });
    }
    const [detailRes, actRes] = await Promise.all([
      fetch(`/api/cms/forms?id=${row.id}`, { cache: "no-store" }),
      fetch(`/api/cms/forms/${row.id}/activities`, { cache: "no-store" }),
    ]);
    if (detailRes.ok) {
      const data = (await detailRes.json()) as { item?: FormSubmission; related?: FormSubmission[] };
      if (data.item) setSelected(data.item);
      setRelated(data.related ?? []);
    }
    if (actRes.ok) {
      const data = (await actRes.json()) as { activities?: FormActivity[] };
      setActivities(data.activities ?? []);
    }
  };

  const bulkPatch = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/cms/forms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds, ...body }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? tCommon("updateFailed"));
    }
    toast.success(t("updated"));
    setSelectedIds([]);
    emitLeadsChanged();
    setRefreshKey((k) => k + 1);
  };

  const detailBase = type === "quote" ? "/admin/forms/quotes" : "/admin/forms/contact";

  const columns: DataTableColumn<FormSubmission>[] = [
    {
      key: "lead",
      header: t("columns.lead"),
      sortable: true,
      sortValue: (row) => leadName(row),
      cell: (row) => (
        <div className="min-w-0">
          <p className={cn("truncate", isUnread(row) && "font-semibold")}>{leadName(row)}</p>
          <p className="truncate text-xs text-muted-foreground">{leadEmail(row) || leadCompany(row)}</p>
        </div>
      ),
    },
    {
      key: "subject",
      header: type === "quote" ? t("columns.company") : t("columns.subject"),
      cell: (row) =>
        type === "quote"
          ? leadCompany(row) || String(row.data.referenceId ?? "—")
          : String(row.data.subject ?? "—"),
    },
    ...(type === "quote"
      ? [
          {
            key: "total",
            header: t("columns.total"),
            cell: (row: FormSubmission) =>
              formatShopPrice(Number(row.data.total ?? 0), String(row.data.currency ?? "USD")),
          },
        ]
      : []),
    {
      key: "status",
      header: t("columns.status"),
      cell: (row) => (
        <div className="flex flex-wrap items-center gap-1">
          <LeadStatusPill status={row.status} label={t(`status.${row.status}`)} />
          <LeadPriorityPill priority={row.priority ?? "normal"} label={t(`priority.${row.priority ?? "normal"}`)} />
          {leadSlaState(row) !== "ok" ? (
            <span className="text-[10px] font-semibold text-oboya-orange">
              {leadSlaState(row) === "overdue" ? t("sla.overdue") : t("sla.warning", { hours: 24 })}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "owner",
      header: t("columns.owner"),
      cell: (row) => row.assigneeName || t("filters.unassigned"),
    },
    {
      key: "date",
      header: t("columns.date"),
      sortable: true,
      sortValue: (row) => row.createdAt,
      cell: (row) => (
        <div className="flex items-center justify-between gap-2">
          <span className="whitespace-nowrap">{new Date(row.createdAt).toLocaleString()}</span>
          <Link
            href={`${detailBase}/${row.id}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={t("detail.openFull")}
            title={t("detail.openFull")}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-oboya-blue-dark/60 transition-colors hover:bg-oboya-soft-white hover:text-oboya-blue-light"
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      ),
    },
  ];

  const tabs = [
    { value: "open", label: t("open"), count: counts.open },
    { value: "unread", label: t("unread"), count: counts.unread },
    ...FORM_SUBMISSION_STATUSES.map((status) => ({
      value: status,
      label: t(`status.${status}`),
      count: counts[status],
    })),
    { value: "", label: tCommon("all"), count: counts.all },
  ];

  const hasFilters = Boolean(
    filters.q || filters.country || filters.assignee || filters.tag || filters.priority || filters.from || filters.to
  );

  return (
    <Can module="forms" action="view" fallback={<AccessDenied />}>
      <AdminPageHeader title={title} description={description} />
      <div className="space-y-4">
        <FilterTabs value={filters.status} onChange={(status) => setFilters({ status })} options={tabs} />
        <FilterBar showReset={hasFilters} onReset={reset}>
          <SearchInput value={filters.q} onChange={(q) => setFilters({ q })} />
          <FilterSelect
            label={t("filters.country")}
            value={filters.country}
            onChange={(country) => setFilters({ country })}
            options={countryOptions}
          />
          <FilterSelect
            label={t("filters.assignee")}
            value={filters.assignee}
            onChange={(assignee) => setFilters({ assignee })}
            options={[
              { value: "none", label: t("filters.unassigned") },
              ...staff.map((user) => ({ value: user.id, label: user.name })),
            ]}
          />
          <FilterSelect
            label={t("filters.tag")}
            value={filters.tag}
            onChange={(tag) => setFilters({ tag })}
            options={tagOptions}
          />
          <FilterSelect
            label={t("filters.priority")}
            value={filters.priority}
            onChange={(priority) => setFilters({ priority })}
            options={FORM_PRIORITIES.map((priority) => ({ value: priority, label: t(`priority.${priority}`) }))}
          />
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {t("filters.from")}
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ from: e.target.value })}
              className="h-8 rounded-md border border-border/70 bg-white px-2 text-xs"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {t("filters.to")}
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ to: e.target.value })}
              className="h-8 rounded-md border border-border/70 bg-white px-2 text-xs"
            />
          </label>
        </FilterBar>

        {error && !loading ? (
          <ErrorState message={error} onRetry={() => setRefreshKey((k) => k + 1)} />
        ) : (
          <DataTable
            data={visible}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.id}
            selectedIds={selectedIds}
            onSelectionChange={can("forms", "edit") ? setSelectedIds : undefined}
            onRowClick={(row) => void openDrawer(row)}
            stickyHeader
            emptyState={<EmptyState icon={Inbox} title={t("emptyTitle")} description={t("empty")} />}
            rowClassName={(row) => (isUnread(row) ? "font-medium bg-oboya-blue/5" : undefined)}
            bulkActions={(ids) =>
              can("forms", "edit") ? (
                <>
                  <select
                    className="h-8 rounded-md border bg-white px-2 text-xs"
                    defaultValue=""
                    onChange={(e) => {
                      const user = staff.find((s) => s.id === e.target.value);
                      if (!user) return;
                      void bulkPatch({ assigneeId: user.id, assigneeName: user.name });
                    }}
                  >
                    <option value="">{t("bulk.assign")}</option>
                    {staff.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="h-8 rounded-md border bg-white px-2 text-xs"
                    defaultValue=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      void bulkPatch({ status: e.target.value as FormSubmissionStatus });
                    }}
                  >
                    <option value="">{t("bulk.status")}</option>
                    {FORM_SUBMISSION_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {t(`status.${status}`)}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" variant="outline" onClick={() => void bulkPatch({ status: "spam" })}>
                    {t("bulk.spam")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void (async () => {
                        const res = await fetch(`/api/cms/forms/export?type=${type}`);
                        if (!res.ok) throw new Error(t("loadFailed"));
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `leads-${type}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success(t("exported"));
                      })().catch((err) => {
                        toast.error(err instanceof Error ? err.message : t("loadFailed"));
                      });
                    }}
                  >
                    {t("bulk.export")} {ids.length}
                  </Button>
                </>
              ) : null
            }
          />
        )}
        {total > rows.length ? (
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => void loadMore()}>
              {tCommon("next")}
            </Button>
          </div>
        ) : null}
      </div>

      <FormDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? leadName(selected) : t("detail.title")}
        width="lg"
      >
        {selected ? (
          <LeadDetail
            compact
            submission={selected}
            related={related}
            activities={activities}
            staff={staff}
            canEdit={can("forms", "edit")}
            canDelete={can("forms", "delete")}
            onUpdated={(next) => {
              setSelected(next);
              setRows((prev) => prev.map((row) => (row.id === next.id ? next : row)));
            }}
          />
        ) : null}
      </FormDrawer>
    </Can>
  );
}
