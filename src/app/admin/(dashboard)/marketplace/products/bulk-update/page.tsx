"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { BulkUpdateWorkspace } from "@/components/admin/marketplace/bulk-update/BulkUpdateWorkspace";
import { Can } from "@/components/admin/permissions/Can";
import { buttonVariants } from "@/components/ui/button";

export default function ProductBulkUpdatePage() {
  const t = useTranslations("admin.products");
  const tBulk = useTranslations("admin.products.bulk");

  return (
    <Can module="marketplace" action="edit">
      <AdminPageHeader
        title={tBulk("title")}
        description={tBulk("description")}
        actions={
          <Link
            href="/admin/marketplace/products"
            className={buttonVariants({ variant: "outline", className: "rounded-full" })}
          >
            {t("backToProducts")}
          </Link>
        }
      />
      <BulkUpdateWorkspace />
    </Can>
  );
}
