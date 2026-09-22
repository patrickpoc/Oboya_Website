"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Can } from "@/components/admin/permissions/Can";
import { AccessDenied } from "@/components/admin/permissions/AccessDenied";
import { HOMEPAGE_SECTION_SLUGS } from "@/lib/cms/homepage-sections";

export function HomepageHub() {
  const t = useTranslations("admin.website.home");

  return (
    <Can module="website" action="edit" fallback={<AccessDenied />}>
      <div>
        <AdminPageHeader title={t("title")} description={t("description")} />

        <ul className="max-w-3xl space-y-3">
          {HOMEPAGE_SECTION_SLUGS.map((slug) => (
            <li key={slug}>
              <Link
                href={`/admin/website/home/${slug}`}
                className="group flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="min-w-0">
                  <p className="font-medium text-oboya-blue-dark">
                    {t(`sections.${slug}.title`)}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {t(`sections.${slug}.description`)}
                  </p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-oboya-green" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Can>
  );
}
