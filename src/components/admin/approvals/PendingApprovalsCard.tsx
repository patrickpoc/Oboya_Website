"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ClipboardCheck } from "lucide-react";
import { ChangeRequestList } from "@/components/admin/approvals/ChangeRequestList";
import { useApprovalCounts } from "@/components/admin/approvals/use-approval-counts";

export function PendingApprovalsCard() {
  const t = useTranslations("admin.approvals");
  const { counts } = useApprovalCounts();

  if (!counts.approver && counts.mine === 0) return null;

  return (
    <section className="mb-6 rounded-xl border border-border/60 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <ClipboardCheck className="size-4 text-oboya-blue" />
        <h2 className="flex-1 text-sm font-semibold text-oboya-blue-dark">
          {counts.approver ? t("dashboard.title") : t("dashboard.mineTitle")}
          {counts.approver && counts.review > 0 ? (
            <span className="ml-2 rounded-full bg-oboya-orange px-2 py-0.5 text-[11px] text-white">
              {counts.review}
            </span>
          ) : null}
        </h2>
        <Link
          href={counts.approver ? "/admin/approvals/review" : "/admin/approvals/mine"}
          className="text-xs font-medium text-oboya-blue-light hover:underline"
        >
          {t("dashboard.viewAll")}
        </Link>
      </div>
      <ChangeRequestList
        mode={counts.approver ? "review" : "mine"}
        limit={5}
        compact
        emptyLabel={counts.approver ? t("dashboard.empty") : t("emptyMine")}
      />
    </section>
  );
}
