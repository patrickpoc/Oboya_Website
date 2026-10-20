"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Can } from "@/components/admin/permissions/Can";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { JobOpeningWithStats } from "@/lib/cms/careers/types";
import { OpeningRowActions, type RowAction } from "./OpeningRowActions";
import { OpeningStatusPill } from "./OpeningStatusPill";

const date = (iso?: string) => (iso ? iso.slice(0, 10) : "—");

export function OpeningsTable({
  items,
  onAction,
}: {
  items: JobOpeningWithStats[];
  onAction: (action: RowAction, opening: JobOpeningWithStats) => void;
}) {
  const t = useTranslations("admin.careers.openings");
  const tWork = useTranslations("admin.careers.common.workModel");
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.title")}</TableHead>
            <TableHead>{t("columns.department")}</TableHead>
            <TableHead>{t("columns.location")}</TableHead>
            <TableHead>{t("columns.workModel")}</TableHead>
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
                  className="font-medium text-oboya-blue-dark hover:underline"
                >
                  {o.title.en || o.slug}
                </Link>
                <p className="font-mono text-xs text-muted-foreground">/{o.slug}</p>
              </TableCell>
              <TableCell>{o.department ?? "—"}</TableCell>
              <TableCell>{[o.city, o.countryCode].filter(Boolean).join(", ") || "—"}</TableCell>
              <TableCell>{o.workModel ? tWork(o.workModel) : "—"}</TableCell>
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
