"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { FormDrawer } from "@/components/admin/forms/FormDrawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormPiiActions } from "@/components/admin/forms/FormPiiActions";
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
  const t = useTranslations("admin.forms.quotes");
  const tCommon = useTranslations("admin.common");
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FormSubmission | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cms/forms?type=quote");
      if (!res.ok) throw new Error(tCommon("loadFailed"));
      const data = (await res.json()) as FormSubmission[];
      setSubmissions(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t("loadFailed"));
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
        header: t("columns.reference"),
        cell: (row: FormSubmission) =>
          String(row.data.referenceId ?? row.id.slice(0, 8)),
      },
      {
        key: "company",
        header: t("columns.company"),
        cell: (row: FormSubmission) => String(row.data.company ?? "—"),
      },
      {
        key: "email",
        header: t("columns.email"),
        cell: (row: FormSubmission) => String(row.data.email ?? "—"),
      },
      {
        key: "items",
        header: t("columns.lines"),
        cell: (row: FormSubmission) => {
          const items = quoteItems(row);
          const count =
            items.length || Number(row.data.itemCount ?? 0) || 0;
          return String(count);
        },
      },
      {
        key: "total",
        header: t("columns.estTotal"),
        cell: (row: FormSubmission) => {
          const currency = String(row.data.currency ?? "USD");
          const total = Number(row.data.total ?? 0);
          return formatShopPrice(total, currency);
        },
      },
      {
        key: "status",
        header: t("columns.status"),
        cell: (row: FormSubmission) => (
          <Badge variant={statusBadgeVariant(row.status)}>
            {tCommon(row.status)}
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
    [t, tCommon]
  );

  const openDetail = (row: FormSubmission) => setSelected(row);

  const items = selected ? quoteItems(selected) : [];
  const currency = selected
    ? String(selected.data.currency ?? "USD")
    : "USD";

  return (
    <div>
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
      />

      <DataTable
        data={submissions}
        columns={columns}
        getRowId={(row) => row.id}
        onRowClick={openDetail}
        emptyMessage={
          loading ? "" : t("empty")
        }
      />

      <FormDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={
          selected
            ? String(selected.data.company ?? t("quoteRequest"))
            : t("quote")
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
            <div className="flex flex-wrap items-center gap-3">
              <FormPiiActions
                id={selected.id}
                onDone={() => {
                  setSelected(null);
                  void load();
                }}
              />
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
            <DetailField label={t("contact")}>
              {String(selected.data.contactName ?? "—")}
            </DetailField>
            <DetailField label={tCommon("email")}>
              <a
                href={`mailto:${String(selected.data.email ?? "")}`}
                className="text-oboya-green hover:underline"
              >
                {String(selected.data.email ?? "—")}
              </a>
            </DetailField>
            <DetailField label={tCommon("phone")}>
              {String(selected.data.phone ?? "—")}
            </DetailField>
            <DetailField label={tCommon("country")}>
              {String(
                selected.data.country ?? selected.data.countryCode ?? "—"
              )}
            </DetailField>
            <DetailField label={t("columns.status")}>
              <Badge variant={statusBadgeVariant(selected.status)}>
                {tCommon(selected.status)}
              </Badge>
            </DetailField>
            {selected.data.message ? (
              <DetailField label={t("notes")}>
                <p className="whitespace-pre-wrap rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
                  {String(selected.data.message)}
                </p>
              </DetailField>
            ) : null}
            <DetailField label={t("lineItems")}>
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
            <DetailField label={t("estimatedTotal")}>
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
