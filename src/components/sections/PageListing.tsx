"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";

interface PageListingProps {
  items: { path: string; messageKey: string }[];
}

export function PageListing({ items }: PageListingProps) {
  const t = useTranslations();
  const tCommon = useTranslations("common");

  return (
    <section className="py-16 md:py-20">
      <Container>
        <p className="mb-10 max-w-2xl text-[var(--text-body)] leading-[var(--text-body-leading)] text-muted-foreground">
          {tCommon("loremShort")}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className="group flex flex-col rounded-xl border border-border/60 bg-white p-6 transition-all hover:border-oboya-green/30 hover:shadow-[var(--shadow-subtle)]"
            >
              <h2 className="mb-2 font-semibold text-oboya-blue-dark group-hover:text-oboya-green">
                {t(`pages.${item.messageKey}.title`)}
              </h2>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                {tCommon("loremShort")}
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-oboya-green">
                {tCommon("loremLink")}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
