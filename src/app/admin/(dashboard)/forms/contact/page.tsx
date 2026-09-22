"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FormDrawer } from "@/components/admin/forms/FormDrawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  FormSubmission,
  FormSubmissionStatus,
} from "@/lib/cms/types";
import { FormPiiActions } from "@/components/admin/forms/FormPiiActions";
import { cn } from "@/lib/utils";


function contactName(row: FormSubmission) {
  const first = String(row.data.firstName ?? "");
  const last = String(row.data.lastName ?? "");
  const full = `${first} ${last}`.trim();
  if (full) return full;
  return String(row.data.name ?? "—");
}

function statusBadgeVariant(
  status: FormSubmissionStatus
): "default" | "secondary" | "outline" {
  if (status === "new") return "default";
  if (status === "archived") return "outline";
  return "secondary";
}

export default function ContactFormsPage() {
  const t = useTranslations("admin.forms.contact");
  const tCommon = useTranslations("admin.common");

  const STATUS_OPTIONS: { value: FormSubmissionStatus | "all"; label: string }[] = [
    { value: "all", label: tCommon("all") },
    { value: "new", label: t("unread") },
    { value: "read", label: t("read") },
    { value: "replied", label: t("replied") },
    { value: "archived", label: t("archived") },
  ];

  const STATUS_LABELS: Record<FormSubmissionStatus, string> = {
    new: t("unread"),
    read: t("read"),
    replied: t("replied"),
    archived: t("archived"),
  };

  const SUBJECT_LABELS: Record<string, string> = {
    general: t("subjects.general"),
    products: t("subjects.products"),
    partnership: t("subjects.partnership"),
    support: t("subjects.support"),
  };
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<FormSubmissionStatus | "all">(
    "all"
  );
  const [selected, setSelected] = useState<FormSubmission | null>(null);

  const refresh = async () => {
    const res = await fetch("/api/cms/forms?type=contact");
    if (!res.ok) throw new Error(tCommon("loadFailed"));
    const data = (await res.json()) as FormSubmission[];
    setSubmissions(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    void (async () => {
      try {
        await refresh();
      } catch {
        toast.error(t("loadFailed"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleStatus = async (
    id: string,
    status: FormSubmissionStatus,
    options?: { silent?: boolean }
  ) => {
    try {
      const res = await fetch("/api/cms/forms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = (await res.json()) as FormSubmission & { error?: string };
      if (!res.ok) throw new Error(data.error ?? tCommon("updateFailed"));
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s))
      );
      setSelected((current) =>
        current?.id === id ? { ...current, status } : current
      );
      if (!options?.silent) {
        toast.success(t("statusUpdated"));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon("couldNotUpdate"));
    }
  };

  const countryFilters = useMemo(() => {
    const counts = new Map<
      string,
      { name: string; total: number; unread: number }
    >();
    for (const row of submissions) {
      const code = String(row.data.countryCode ?? "OTHER");
      const name = String(row.data.countryName ?? code);
      const entry = counts.get(code) ?? { name, total: 0, unread: 0 };
      entry.total += 1;
      if (row.status === "new") entry.unread += 1;
      counts.set(code, entry);
    }
    return Array.from(counts.entries())
      .map(([code, meta]) => ({ code, ...meta }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [submissions]);

  const filtered = useMemo(() => {
    return submissions.filter((row) => {
      if (countryFilter !== "all") {
        if (String(row.data.countryCode ?? "") !== countryFilter) return false;
      }
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      return true;
    });
  }, [submissions, countryFilter, statusFilter]);

  const unreadTotal = submissions.filter((s) => s.status === "new").length;

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: t("columns.name"),
        cell: (row: FormSubmission) => (
          <span className="font-medium text-oboya-blue-dark">
            {contactName(row)}
          </span>
        ),
      },
      {
        key: "email",
        header: t("columns.email"),
        cell: (row: FormSubmission) => String(row.data.email ?? "—"),
      },
      {
        key: "country",
        header: t("columns.country"),
        cell: (row: FormSubmission) =>
          String(row.data.countryName ?? row.data.countryCode ?? "—"),
      },
      {
        key: "subject",
        header: t("columns.subject"),
        cell: (row: FormSubmission) => {
          const key = String(row.data.subject ?? "");
          return SUBJECT_LABELS[key] ?? (key || "—");
        },
      },
      {
        key: "status",
        header: t("columns.status"),
        cell: (row: FormSubmission) => (
          <Badge variant={statusBadgeVariant(row.status)}>
            {STATUS_LABELS[row.status]}
          </Badge>
        ),
      },
      {
        key: "createdAt",
        header: t("columns.date"),
        sortable: true,
        cell: (row: FormSubmission) =>
          new Date(row.createdAt).toLocaleString(),
      },
    ],
    [t]
  );

  const openDetail = (row: FormSubmission) => {
    if (row.status === "new") {
      void handleStatus(row.id, "read", { silent: true });
      setSelected({ ...row, status: "read" });
    } else {
      setSelected(row);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title={t("title")}
        description={t("description", { unread: unreadTotal, total: submissions.length })}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip
          active={countryFilter === "all"}
          onClick={() => setCountryFilter("all")}
          label={t("allCountries", { count: submissions.length })}
        />
        {countryFilters.map((country) => (
          <FilterChip
            key={country.code}
            active={countryFilter === country.code}
            onClick={() => setCountryFilter(country.code)}
            label={
              country.unread
                ? t("countryUnread", {
                    name: country.name,
                    total: country.total,
                    unread: country.unread,
                  })
                : t("countryCount", { name: country.name, total: country.total })
            }
          />
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((option) => (
          <FilterChip
            key={option.value}
            active={statusFilter === option.value}
            onClick={() => setStatusFilter(option.value)}
            label={option.label}
          />
        ))}
      </div>

      {loading ? null : (
        <DataTable
          data={filtered}
          columns={columns}
          getRowId={(row) => row.id}
          onRowClick={openDetail}
          emptyMessage={t("empty")}
        />
      )}

      <FormDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? contactName(selected) : t("drawerFallback")}
        description={
          selected
            ? new Date(selected.createdAt).toLocaleString()
            : undefined
        }
        width="md"
        footer={
          selected ? (
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm text-muted-foreground">{t("columns.status")}</label>
              <select
                value={selected.status}
                onChange={(e) =>
                  void handleStatus(
                    selected.id,
                    e.target.value as FormSubmissionStatus
                  )
                }
                className="h-9 rounded-md border border-input bg-white px-2 text-sm"
              >
                {(Object.keys(STATUS_LABELS) as FormSubmissionStatus[]).map(
                  (value) => (
                    <option key={value} value={value}>
                      {STATUS_LABELS[value]}
                    </option>
                  )
                )}
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => setSelected(null)}
              >
                {tCommon("close")}
              </Button>
              <FormPiiActions
                id={selected.id}
                onDone={() => {
                  setSelected(null);
                  void refresh();
                }}
              />
            </div>
          ) : null
        }
      >
        {selected && (
          <div className="space-y-5 text-sm">
            <DetailField label={t("columns.status")}>
              <Badge variant={statusBadgeVariant(selected.status)}>
                {STATUS_LABELS[selected.status]}
              </Badge>
            </DetailField>
            <DetailField label={t("columns.country")}>
              {String(
                selected.data.countryName ?? selected.data.countryCode ?? "—"
              )}
            </DetailField>
            <DetailField label={t("columns.subject")}>
              {SUBJECT_LABELS[String(selected.data.subject ?? "")] ??
                String(selected.data.subject ?? "—")}
            </DetailField>
            <DetailField label={t("columns.email")}>
              <a
                href={`mailto:${String(selected.data.email ?? "")}`}
                className="text-oboya-green hover:underline"
              >
                {String(selected.data.email ?? "—")}
              </a>
            </DetailField>
            <DetailField label={t("phone")}>
              {selected.data.phone ? (
                <a
                  href={`tel:${String(selected.data.phone).replace(/\s/g, "")}`}
                  className="hover:underline"
                >
                  {String(selected.data.phone)}
                </a>
              ) : (
                "—"
              )}
            </DetailField>
            <DetailField label={t("message")}>
              <p className="whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/30 px-3 py-3 text-oboya-blue-dark">
                {String(selected.data.message ?? "—")}
              </p>
            </DetailField>
          </div>
        )}
      </FormDrawer>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-oboya-blue-dark bg-oboya-blue-dark text-white"
          : "border-border bg-white text-oboya-blue-dark hover:border-oboya-blue-dark/40"
      )}
    >
      {label}
    </button>
  );
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-oboya-blue-dark">{children}</div>
    </div>
  );
}
