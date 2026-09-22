"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { BulkImportWorkspace } from "@/components/admin/marketplace/bulk-import/BulkImportWorkspace";
import { Can } from "@/components/admin/permissions/Can";
import { buttonVariants } from "@/components/ui/button";

export default function ProductBulkImportPage() {
  const t = useTranslations("admin.products");
  const tImport = useTranslations("admin.products.bulkImport");

  return (
    <Can module="marketplace" action="create">
      <AdminPageHeader
        title={tImport("title")}
        description={tImport("description")}
        actions={
          <Link
            href="/admin/marketplace/products"
            className={buttonVariants({ variant: "outline", className: "rounded-full" })}
          >
            {t("backToProducts")}
          </Link>
        }
      />
      <BulkImportWorkspace />
    </Can>
  );
}
