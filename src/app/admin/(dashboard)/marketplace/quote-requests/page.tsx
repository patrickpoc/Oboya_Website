"use client";

import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Can } from "@/components/admin/permissions/Can";
import { AccessDenied } from "@/components/admin/permissions/AccessDenied";

export default function Page() {
  const t = useTranslations("admin.products.stubs.quoteRequests");

  return (
    <Can module="marketplace" action="view" fallback={<AccessDenied />}>
      <AdminPageHeader title={t("title")} description={t("description")} />
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          {t("empty")}
        </CardContent>
      </Card>
    </Can>
  );
}
