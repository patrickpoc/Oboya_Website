"use client";

import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { MapLocationEditor } from "@/components/admin/MapLocationEditor";

export default function GlobalMapPage() {
  const t = useTranslations("admin.globalPresence.map");
  return (
    <div>
      <AdminPageHeader title={t("title")} description={t("description")} />
      <MapLocationEditor />
    </div>
  );
}
