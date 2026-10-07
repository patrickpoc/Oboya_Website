"use client";

import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { AccessDenied } from "@/components/admin/permissions/AccessDenied";
import { Can } from "@/components/admin/permissions/Can";

export function CheckoutUnavailable({
  titleKey,
}: {
  titleKey: "freightTitle" | "couponsTitle" | "paymentsTitle";
}) {
  const t = useTranslations("admin.checkout");

  return (
    <Can module="marketplace" action="view" fallback={<AccessDenied />}>
      <AdminPageHeader title={t(titleKey)} description={t("notEnabled")} />
    </Can>
  );
}
