"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Archive, Copy, Pencil, RotateCcw, Trash2, Users, XCircle, Send } from "lucide-react";
import { Can } from "@/components/admin/permissions/Can";
import { nextOpeningStatus, type OpeningAction } from "@/lib/cms/careers/lifecycle";
import type { JobOpening } from "@/lib/cms/careers/types";

export type RowAction = OpeningAction | "duplicate" | "delete";

const btn = "inline-flex rounded p-1 hover:bg-muted";

export function OpeningRowActions({
  opening,
  onAction,
}: {
  opening: JobOpening;
  onAction: (action: RowAction, opening: JobOpening) => void;
}) {
  const t = useTranslations("admin.careers.openings.actions");
  const can = (action: OpeningAction) => nextOpeningStatus(action, opening.status) !== null;
  const item = (action: RowAction, label: string, icon: React.ReactNode, className = "") => (
    <button
      type="button"
      className={`${btn} ${className}`}
      title={label}
      aria-label={label}
      onClick={() => onAction(action, opening)}
    >
      {icon}
    </button>
  );
  return (
    <div className="flex items-center justify-end gap-0.5">
      <Link
        href={`/admin/careers/applications?opening=${opening.id}`}
        className={btn}
        title={t("viewApplications")}
        aria-label={t("viewApplications")}
      >
        <Users className="size-3.5" />
      </Link>
      <Can module="careers" action="edit">
        <Link
          href={`/admin/careers/openings/${opening.id}`}
          className={btn}
          title={t("edit")}
          aria-label={t("edit")}
        >
          <Pencil className="size-3.5" />
        </Link>
      </Can>
      <Can module="careers" action="create">
        {item("duplicate", t("duplicate"), <Copy className="size-3.5" />)}
      </Can>
      <Can module="careers" action="publish">
        {can("publish") && item("publish", t("publish"), <Send className="size-3.5 text-oboya-green" />)}
        {can("close") && item("close", t("close"), <XCircle className="size-3.5" />)}
        {can("reopen") && item("reopen", t("reopen"), <RotateCcw className="size-3.5" />)}
      </Can>
      <Can module="careers" action={opening.status === "draft" ? "edit" : "publish"}>
        {can("archive") && item("archive", t("archive"), <Archive className="size-3.5" />)}
      </Can>
      <Can module="careers" action="delete">
        {item("delete", t("delete"), <Trash2 className="size-3.5" />, "text-destructive")}
      </Can>
    </div>
  );
}
