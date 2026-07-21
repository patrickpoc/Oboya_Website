"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FormDrawer } from "@/components/admin/forms/FormDrawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getFormSubmissions,
  updateSubmissionStatus,
} from "@/lib/cms/repositories/forms-repository";
import type {
  FormSubmission,
  FormSubmissionStatus,
} from "@/lib/cms/types";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: FormSubmissionStatus | "all"; label: string }[] =
  [
    { value: "all", label: "All" },
    { value: "new", label: "Unread" },
    { value: "read", label: "Read" },
    { value: "replied", label: "Replied" },
    { value: "archived", label: "Archived" },
  ];

const STATUS_LABELS: Record<FormSubmissionStatus, string> = {
  new: "Unread",
  read: "Read",
  replied: "Replied",
  archived: "Archived",
};

const SUBJECT_LABELS: Record<string, string> = {
  general: "General Inquiry",
  products: "Products & Solutions",
  partnership: "Partnership",
  support: "Support",
};

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
  const [submissions, setSubmissions] = useState(
    getFormSubmissions("contact")
  );
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<FormSubmissionStatus | "all">(
    "all"
  );
  const [selected, setSelected] = useState<FormSubmission | null>(null);

  const refresh = () => setSubmissions(getFormSubmissions("contact"));

  const handleStatus = (
    id: string,
    status: FormSubmissionStatus,
    options?: { silent?: boolean }
  ) => {
    updateSubmissionStatus(id, status);
    refresh();
    setSelected((current) =>
      current?.id === id ? { ...current, status } : current
    );
    if (!options?.silent) {
      toast.success("Status updated");
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
        header: "Name",
        cell: (row: FormSubmission) => (
          <span className="font-medium text-oboya-blue-dark">
            {contactName(row)}
          </span>
        ),
      },
      {
        key: "email",
        header: "Email",
        cell: (row: FormSubmission) => String(row.data.email ?? "—"),
      },
      {
        key: "country",
        header: "Country",
        cell: (row: FormSubmission) =>
          String(row.data.countryName ?? row.data.countryCode ?? "—"),
      },
      {
        key: "subject",
        header: "Subject",
        cell: (row: FormSubmission) => {
          const key = String(row.data.subject ?? "");
          return SUBJECT_LABELS[key] ?? (key || "—");
        },
      },
      {
        key: "status",
        header: "Status",
        cell: (row: FormSubmission) => (
          <Badge variant={statusBadgeVariant(row.status)}>
            {STATUS_LABELS[row.status]}
          </Badge>
        ),
      },
      {
        key: "createdAt",
        header: "Date",
        sortable: true,
        cell: (row: FormSubmission) =>
          new Date(row.createdAt).toLocaleString(),
      },
    ],
    []
  );

  const openDetail = (row: FormSubmission) => {
    if (row.status === "new") {
      updateSubmissionStatus(row.id, "read");
      refresh();
      setSelected({ ...row, status: "read" });
    } else {
      setSelected(row);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Contact Submissions"
        description={`${unreadTotal} unread · ${submissions.length} total from the website contact form.`}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip
          active={countryFilter === "all"}
          onClick={() => setCountryFilter("all")}
          label={`All countries (${submissions.length})`}
        />
        {countryFilters.map((country) => (
          <FilterChip
            key={country.code}
            active={countryFilter === country.code}
            onClick={() => setCountryFilter(country.code)}
            label={`${country.name} (${country.total}${
              country.unread ? ` · ${country.unread} new` : ""
            })`}
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

      <DataTable
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={openDetail}
        emptyMessage="No contact submissions match these filters."
      />

      <FormDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? contactName(selected) : "Contact"}
        description={
          selected
            ? new Date(selected.createdAt).toLocaleString()
            : undefined
        }
        width="md"
        footer={
          selected ? (
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm text-muted-foreground">Status</label>
              <select
                value={selected.status}
                onChange={(e) =>
                  handleStatus(
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
                Close
              </Button>
            </div>
          ) : null
        }
      >
        {selected && (
          <div className="space-y-5 text-sm">
            <DetailField label="Status">
              <Badge variant={statusBadgeVariant(selected.status)}>
                {STATUS_LABELS[selected.status]}
              </Badge>
            </DetailField>
            <DetailField label="Country">
              {String(
                selected.data.countryName ?? selected.data.countryCode ?? "—"
              )}
            </DetailField>
            <DetailField label="Subject">
              {SUBJECT_LABELS[String(selected.data.subject ?? "")] ??
                String(selected.data.subject ?? "—")}
            </DetailField>
            <DetailField label="Email">
              <a
                href={`mailto:${String(selected.data.email ?? "")}`}
                className="text-oboya-green hover:underline"
              >
                {String(selected.data.email ?? "—")}
              </a>
            </DetailField>
            <DetailField label="Phone">
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
            <DetailField label="Message">
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
