"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Can } from "@/components/admin/permissions/Can";
import {
  HOMEPAGE_SECTION_SLUGS,
  HOMEPAGE_SECTION_META,
} from "@/lib/cms/homepage-sections";

export function HomepageHub() {
  return (
    <Can
      module="website"
      action="edit"
      fallback={<p className="text-sm text-muted-foreground">Access denied.</p>}
    >
      <div>
        <AdminPageHeader
          title="Homepage"
          description="Edit each homepage section individually. The interactive map component is fixed and cannot be changed here."
        />

        <ul className="max-w-3xl space-y-3">
          {HOMEPAGE_SECTION_SLUGS.map((slug) => {
            const meta = HOMEPAGE_SECTION_META[slug];
            return (
              <li key={slug}>
                <Link
                  href={`/admin/website/home/${slug}`}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-oboya-blue-dark">{meta.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{meta.description}</p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-oboya-green" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </Can>
  );
}
