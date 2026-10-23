"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Can } from "@/components/admin/permissions/Can";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { JobOpeningWithStats } from "@/lib/cms/careers/types";
import { OpeningRowActions, type RowAction } from "./OpeningRowActions";
import { OpeningStatusPill } from "./OpeningStatusPill";


export function OpeningsTable({
  items,
  onAction,
}: {
  items: JobOpeningWithStats[];
  onAction: (action: RowAction, opening: JobOpeningWithStats) => void;
}) {
  const locale = useLocale();
  const date = (iso?: string) => iso ? new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }) : "—";
  const t = useTranslations("admin.careers.openings");
  const tWork = useTranslations("admin.careers.common.workModel");
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-white">
      <Table className="min-w-[960px]">
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.title")}</TableHead>
            <TableHead>{t("columns.location")}</TableHead>
            <TableHead>{t("columns.status")}</TableHead>
            <TableHead>{t("columns.applications")}</TableHead>
            <TableHead>{t("columns.publishedAt")}</TableHead>
            <TableHead>{t("columns.updatedAt")}</TableHead>
            <TableHead className="text-right">{t("columns.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((o) => (
            <TableRow key={o.id}>
              <TableCell>
                <Link
                  href={`/admin/careers/openings/${o.id}`}
                  className="inline-block py-1 font-medium text-oboya-blue-dark underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-oboya-blue"
                >
                  {o.title.en || o.slug}
                </Link>
                <p className="text-xs text-muted-foreground">{o.department || "—"}</p>
              </TableCell>
              <TableCell>
                <p>{[o.city, o.countryCode].filter(Boolean).join(", ") || "—"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{o.workModel ? tWork(o.workModel) : "—"}</p>
              </TableCell>
              <TableCell>
                <OpeningStatusPill status={o.status} />
              </TableCell>
              <TableCell>
                <Can
                  module="careers"
                  action="edit"
                  fallback={<span>{t("applicationsCount", { count: o.stats?.total ?? 0 })}</span>}
                >
                  <Link
                    href={`/admin/careers/applications?opening=${o.id}`}
                    className="text-oboya-blue-light hover:underline"
                  >
                    {t("applicationsCount", { count: o.stats?.total ?? 0 })}
                  </Link>
                </Can>
              </TableCell>
              <TableCell>{date(o.publishedAt)}</TableCell>
              <TableCell>{date(o.updatedAt)}</TableCell>
              <TableCell>
                <OpeningRowActions opening={o} onAction={onAction} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
