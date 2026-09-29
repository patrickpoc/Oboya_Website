"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChangeRequestList } from "@/components/admin/approvals/ChangeRequestList";

const STATUS_TABS: Record<string, string> = {
  open: "open",
  approved: "approved",
  rejected: "rejected,cancelled,superseded,failed",
};

export default function ApprovalsReviewPage() {
  const t = useTranslations("admin.approvals");
  const [tab, setTab] = useState("open");

  return (
    <div>
      <AdminPageHeader title={t("reviewTitle")} description={t("reviewDescription")} />
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="open">{t("filters.open")}</TabsTrigger>
          <TabsTrigger value="approved">{t("status.approved")}</TabsTrigger>
          <TabsTrigger value="rejected">{t("filters.closed")}</TabsTrigger>
        </TabsList>
      </Tabs>
      <ChangeRequestList key={tab} mode="review" status={STATUS_TABS[tab]} />
    </div>
  );
}
