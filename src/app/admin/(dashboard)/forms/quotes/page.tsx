"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FormDrawer } from "@/components/admin/forms/FormDrawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatShopPrice } from "@/lib/shop/format-price";
import type { FormSubmission, FormSubmissionStatus } from "@/lib/cms/types";

type QuoteLineItem = {
  productId?: string;
  sku?: string;
  name?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
};

const STATUS_LABELS: Record<FormSubmissionStatus, string> = {
  new: "New",
  read: "Read",
  replied: "Replied",
  archived: "Archived",
};

function statusBadgeVariant(
  status: FormSubmissionStatus
): "default" | "secondary" | "outline" {
  if (status === "new") return "default";
  if (status === "archived") return "outline";
  return "secondary";
}

function quoteItems(row: FormSubmission): QuoteLineItem[] {
  const raw = row.data.items;
  return Array.isArray(raw) ? (raw as QuoteLineItem[]) : [];
}

export default function QuoteFormsPage() {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FormSubmission | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cms/forms?type=quote");
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as FormSubmission[];
      setSubmissions(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Could not load quote submissions");
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo(
    () => [
      {
        key: "reference",
        header: "Reference",
        cell: (row: FormSubmission) =>
          String(row.data.referenceId ?? row.id.slice(0, 8)),
      },
      {
        key: "company",
        header: "Company",
        cell: (row: FormSubmission) => String(row.data.company ?? "—"),
      },
      {
        key: "email",
        header: "Email",
        cell: (row: FormSubmission) => String(row.data.email ?? "—"),
      },
      {
        key: "items",
        header: "Lines",
        cell: (row: FormSubmission) => {
          const items = quoteItems(row);
          const count =
            items.length || Number(row.data.itemCount ?? 0) || 0;
          return String(count);
        },
      },
      {
        key: "total",
        header: "Est. Total",
        cell: (row: FormSubmission) => {
          const currency = String(row.data.currency ?? "USD");
          const total = Number(row.data.total ?? 0);
          return formatShopPrice(total, currency);
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

  const openDetail = (row: FormSubmission) => setSelected(row);

  const items = selected ? quoteItems(selected) : [];
  const currency = selected
    ? String(selected.data.currency ?? "USD")
    : "USD";

  return (
    <div>
      <AdminPageHeader
        title="Quote Submissions"
        description="RFQ requests from the shop — line items validated server-side."
      />

      <DataTable
        data={submissions}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={openDetail}
        emptyMessage={
          loading ? "Loading…" : "No quote submissions yet."
        }
      />

      <FormDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={
          selected
            ? String(selected.data.company ?? "Quote request")
            : "Quote"
        }
        description={
          selected
            ? `${String(selected.data.referenceId ?? "")} · ${new Date(
                selected.createdAt
              ).toLocaleString()}`
            : undefined
        }
        width="lg"
        footer={
          selected ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => setSelected(null)}
            >
              Close
            </Button>
          ) : null
        }
      >
        {selected && (
          <div className="space-y-5 text-sm">
            <DetailField label="Contact">
              {String(selected.data.contactName ?? "—")}
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
              {String(selected.data.phone ?? "—")}
            </DetailField>
            <DetailField label="Country">
              {String(
                selected.data.country ?? selected.data.countryCode ?? "—"
              )}
            </DetailField>
            <DetailField label="Status">
              <Badge variant={statusBadgeVariant(selected.status)}>
                {STATUS_LABELS[selected.status]}
              </Badge>
            </DetailField>
            {selected.data.message ? (
              <DetailField label="Notes">
                <p className="whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
                  {String(selected.data.message)}
                </p>
              </DetailField>
            ) : null}
            <DetailField label="Line items">
              {items.length === 0 ? (
                <p className="text-muted-foreground">No line items stored.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">SKU</th>
                        <th className="px-3 py-2">Product</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-right">Unit</th>
                        <th className="px-3 py-2 text-right">Line</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr
                          key={`${item.productId ?? item.sku ?? index}`}
                          className="border-t border-border/50"
                        >
                          <td className="px-3 py-2 font-mono text-xs">
                            {item.sku ?? "—"}
                          </td>
                          <td className="px-3 py-2">{item.name ?? "—"}</td>
                          <td className="px-3 py-2 text-right">
                            {item.quantity ?? "—"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatShopPrice(Number(item.unitPrice ?? 0), currency)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {formatShopPrice(Number(item.lineTotal ?? 0), currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DetailField>
            <DetailField label="Estimated total">
              <span className="text-base font-semibold text-oboya-blue-dark">
                {formatShopPrice(Number(selected.data.total ?? 0), currency)}
              </span>
            </DetailField>
          </div>
        )}
      </FormDrawer>
    </div>
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
