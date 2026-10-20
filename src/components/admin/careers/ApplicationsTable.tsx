"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
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
  const format = useFormatter();
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
              <TableCell className="min-w-56 py-4">
                <Link
                  href={`/admin/careers/applications/${a.id}`}
                  className={`text-oboya-blue-dark hover:underline ${a.readAt ? "font-medium" : "font-bold"}`}
                >
                  {!a.readAt ? <span className="mr-2 inline-block size-2 rounded-full bg-oboya-blue" aria-label={t("unread")} /> : null}
                  {a.fullName || "—"}
                </Link>
                <p className="mt-1 break-all text-xs text-muted-foreground">{a.email || "—"}</p>
              </TableCell>
              <TableCell className="min-w-52 max-w-80 whitespace-normal">
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
              <TableCell><time dateTime={a.createdAt}>{format.dateTime(new Date(a.createdAt), { dateStyle: "medium" })}</time></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
