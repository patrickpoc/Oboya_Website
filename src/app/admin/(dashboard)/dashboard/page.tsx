"use client";

import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { QuickAccessGrid } from "@/components/admin/dashboard/QuickAccessGrid";
import { useAdmin } from "@/contexts/AdminContext";

export default function DashboardPage() {
  const t = useTranslations("admin.dashboard");
  const { user } = useAdmin();
  const firstName = user.name.split(" ")[0];

  return (
    <div>
      <AdminPageHeader
        title={t("title")}
        description={t("welcome", { name: firstName })}
      />
      <QuickAccessGrid />
    </div>
  );
}
