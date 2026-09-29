"use client";

import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { ComingSoon } from "@/components/admin/common";
import { Can } from "@/components/admin/permissions/Can";
import { AccessDenied } from "@/components/admin/permissions/AccessDenied";

export default function Page() {
  const t = useTranslations("admin.settings.languages");
  return (
    <Can module="settings" action="view" fallback={<AccessDenied />}>
      <AdminPageHeader title={t("title")} description={t("description")} />
      <ComingSoon module={t("title")} />
    </Can>
  );
}
