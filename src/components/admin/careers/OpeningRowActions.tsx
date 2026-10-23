"use client";

import Link from "next/link";
import { usePermission } from "@/contexts/AdminContext";
import { Menu } from "@base-ui/react/menu";
import { useTranslations } from "next-intl";
import { Archive, Copy, Pencil, RotateCcw, Trash2, Users, XCircle, Send, MoreHorizontal } from "lucide-react";
import { Can } from "@/components/admin/permissions/Can";
import { nextOpeningStatus, type OpeningAction } from "@/lib/cms/careers/lifecycle";
import type { JobOpening } from "@/lib/cms/careers/types";

export type RowAction = OpeningAction | "duplicate" | "delete";

const btn = "inline-flex size-9 items-center justify-center rounded-lg text-oboya-blue-dark hover:bg-oboya-soft-white focus-visible:outline-2 focus-visible:outline-oboya-blue";

export function OpeningRowActions({
  opening,
  onAction,
}: {
  opening: JobOpening;
  onAction: (action: RowAction, opening: JobOpening) => void;
}) {
  const canCreate = usePermission("careers", "create");
  const canPublish = usePermission("careers", "publish");
  const canEdit = usePermission("careers", "edit");
  const canDelete = usePermission("careers", "delete");
  const tColumns = useTranslations("admin.careers.openings.columns");
  const t = useTranslations("admin.careers.openings.actions");
  const can = (action: OpeningAction) => nextOpeningStatus(action, opening.status) !== null;
  const hasSecondaryActions = canCreate || canDelete
    || (canPublish && (["publish", "close", "reopen", "archive"] as OpeningAction[]).some(can))
    || (canEdit && opening.status === "draft" && can("archive"));
  const item = (action: RowAction, label: string, icon: React.ReactNode, className = "") => (
    <Menu.Item
      className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none data-[highlighted]:bg-oboya-soft-white ${className}`}
      onClick={() => onAction(action, opening)}
    >
      {icon}{label}
    </Menu.Item>
  );
  return (
    <div className="flex items-center justify-end gap-0.5">
      <Link
        href={`/admin/careers/applications?opening=${opening.id}`}
        className={btn}
        title={t("viewApplications")}
        aria-label={t("viewApplications")}
      >
        <Users className="size-4" />
      </Link>
      <Can module="careers" action="edit">
        <Link
          href={`/admin/careers/openings/${opening.id}`}
          className={btn}
          title={t("edit")}
          aria-label={t("edit")}
        >
          <Pencil className="size-4" />
        </Link>
      </Can>
      {hasSecondaryActions ? <Menu.Root>
        <Menu.Trigger className={btn} aria-label={tColumns("actions")}><MoreHorizontal className="size-4" /></Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner side="bottom" align="end" sideOffset={6} className="z-50">
            <Menu.Popup className="min-w-44 rounded-xl border border-border/60 bg-white p-1 shadow-lg">
      <Can module="careers" action="create">
        {item("duplicate", t("duplicate"), <Copy className="size-4" />)}
      </Can>
      <Can module="careers" action="publish">
        {can("publish") && item("publish", t("publish"), <Send className="size-4 text-oboya-green" />)}
        {can("close") && item("close", t("close"), <XCircle className="size-4" />)}
        {can("reopen") && item("reopen", t("reopen"), <RotateCcw className="size-4" />)}
      </Can>
      <Can module="careers" action={opening.status === "draft" ? "edit" : "publish"}>
        {can("archive") && item("archive", t("archive"), <Archive className="size-4" />)}
      </Can>
      <Can module="careers" action="delete">
        <Menu.Separator className="my-1 border-t border-border/60" />
        {item("delete", t("delete"), <Trash2 className="size-4" />, "text-oboya-orange")}
      </Can>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root> : null}
    </div>
  );
}
