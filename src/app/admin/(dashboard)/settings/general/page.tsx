"use client";

import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { ComingSoon } from "@/components/admin/common";
import { siteConfig } from "@/constants/site";

export default function GeneralSettingsPage() {
  const t = useTranslations("admin.settings.general");
  const tCommon = useTranslations("admin.common");
  return (
    <div>
      <AdminPageHeader title={t("title")} description={t("description")} />
      <ComingSoon module={t("title")} description={tCommon("readOnlyNotice")} />
      <dl className="mt-6 grid max-w-2xl gap-3 rounded-xl border border-border/60 bg-white p-5 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">{t("companyName")}</dt>
          <dd>{siteConfig.name}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("websiteUrl")}</dt>
          <dd>{siteConfig.url}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{tCommon("email")}</dt>
          <dd>{siteConfig.company.email}</dd>
        </div>
      </dl>
    </div>
  );
}
