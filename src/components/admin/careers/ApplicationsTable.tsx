"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { StatusPill, type PillTone } from "@/components/admin/common";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { JobApplication, PipelineStatus } from "@/lib/cms/careers/types";

export const PIPELINE_TONES: Record<PipelineStatus, PillTone> = {
  new: "info",
  screening: "warning",
  interview: "warning",
  offer: "success",
  hired: "success",
  rejected: "danger",
  withdrawn: "muted",
};

export function ApplicationsTable({
  items,
  openingTitles,
}: {
  items: JobApplication[];
  openingTitles: Record<string, string>;
}) {
  const t = useTranslations("admin.careers.applications");
  const tPipe = useTranslations("admin.careers.common.pipeline");
  const tSource = useTranslations("admin.careers.common.source");
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("columns.candidate")}</TableHead>
            <TableHead>{t("columns.opening")}</TableHead>
            <TableHead>{t("columns.status")}</TableHead>
            <TableHead>{t("columns.rating")}</TableHead>
            <TableHead>{t("columns.source")}</TableHead>
            <TableHead>{t("columns.appliedAt")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((a) => (
            <TableRow key={a.id}>
              <TableCell>
                <Link
                  href={`/admin/careers/applications/${a.id}`}
                  className={`text-oboya-blue-dark hover:underline ${a.readAt ? "font-medium" : "font-bold"}`}
                >
                  {a.fullName || "—"}
                </Link>
                <p className="text-xs text-muted-foreground">{a.email || "—"}</p>
              </TableCell>
              <TableCell>
                {a.openingId ? (openingTitles[a.openingId] ?? a.openingId) : t("filters.talentPool")}
              </TableCell>
              <TableCell>
                <StatusPill tone={PIPELINE_TONES[a.status]}>{tPipe(a.status)}</StatusPill>
              </TableCell>
              <TableCell>
                {a.rating ? (
                  <span className="inline-flex items-center gap-1 text-oboya-yellow-dark">
                    <Star className="size-3.5 fill-current" />
                    {a.rating}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{a.source ? tSource(a.source) : "—"}</TableCell>
              <TableCell>{a.createdAt.slice(0, 10)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
