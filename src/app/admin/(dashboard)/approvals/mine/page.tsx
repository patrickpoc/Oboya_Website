"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChangeRequestList } from "@/components/admin/approvals/ChangeRequestList";

const STATUS_TABS: Record<string, string> = {
  open: "open",
  all: "",
};

export default function MyApprovalRequestsPage() {
  const t = useTranslations("admin.approvals");
  const tCommon = useTranslations("admin.common");
  const [tab, setTab] = useState("open");

  return (
    <div>
      <AdminPageHeader title={t("mineTitle")} description={t("mineDescription")} />
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="open">{t("filters.open")}</TabsTrigger>
          <TabsTrigger value="all">{tCommon("all")}</TabsTrigger>
        </TabsList>
      </Tabs>
      <ChangeRequestList key={tab} mode="mine" status={STATUS_TABS[tab]} />
    </div>
  );
}
