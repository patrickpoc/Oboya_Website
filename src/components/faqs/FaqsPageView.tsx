"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { pickLocalized } from "@/lib/cms/utils";
import type { CmsFaqCategory, CmsFaqItem } from "@/lib/cms/repositories/faqs-repository";
import { cn } from "@/lib/utils";

interface FaqViewCategory {
  category: CmsFaqCategory;
  items: CmsFaqItem[];
}

interface FaqsPageViewProps {
  locale: string;
  categories: CmsFaqCategory[];
  faqs: CmsFaqItem[];
}

function matchesQuery(
  query: string,
  faq: CmsFaqItem,
  categoryTitle: string,
  locale: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const question = pickLocalized(faq.question, locale).toLowerCase();
  const answer = pickLocalized(faq.answer, locale).toLowerCase();
  const keywords = faq.keywords.join(" ").toLowerCase();

  return (
    question.includes(q) ||
    answer.includes(q) ||
    categoryTitle.toLowerCase().includes(q) ||
    keywords.includes(q)
  );
}

export function FaqsPageView({ locale, categories, faqs }: FaqsPageViewProps) {
  const t = useTranslations("faqsPage");
  const [search, setSearch] = useState("");

  const grouped = useMemo(() => {
    const byCategory = new Map<string, CmsFaqItem[]>();

    for (const faq of faqs) {
      const category = categories.find((c) => c.id === faq.categoryId);
      if (!category) continue;

      const categoryTitle = pickLocalized(category.title, locale);
      if (!matchesQuery(search, faq, categoryTitle, locale)) continue;

      const list = byCategory.get(category.id) ?? [];
      list.push(faq);
      byCategory.set(category.id, list);
    }

    return categories
      .filter((category) => byCategory.has(category.id))
      .map((category) => ({
        category,
        items: (byCategory.get(category.id) ?? []).sort(
          (a, b) => a.order - b.order
        ),
      })) satisfies FaqViewCategory[];
  }, [categories, faqs, locale, search]);

  const totalMatches = grouped.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <section className="bg-oboya-soft-white py-16 md:py-20">
      <Container size="narrow">
        <p className="mb-8 text-[var(--text-body)] leading-[var(--text-body-leading)] text-muted-foreground">
          {t("intro")}
        </p>

        <div className="relative mb-10">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-oboya-green" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-12 rounded-full border-border/60 bg-white pl-11 text-oboya-blue-dark shadow-sm"
            aria-label={t("searchPlaceholder")}
          />
        </div>

        {totalMatches === 0 ? (
          <p className="rounded-xl border border-border/60 bg-white px-5 py-8 text-center text-sm text-muted-foreground">
            {t("noResults")}
          </p>
        ) : (
          <div className="space-y-6">
            {grouped.map(({ category, items }) => {
              const categoryTitle = pickLocalized(category.title, locale);
              const categoryKey = category.id;

              return (
                <div
                  key={categoryKey}
                  className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm"
                >
                  <Accordion defaultValue={[categoryKey]}>
                    <AccordionItem value={categoryKey} className="border-0">
                      <AccordionTrigger
                        className={cn(
                          "px-5 py-4 font-display text-base font-semibold text-oboya-blue-dark hover:no-underline",
                          "[&_[data-slot=accordion-trigger-icon]]:text-oboya-green"
                        )}
                      >
                        {categoryTitle}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          ({items.length})
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-2 pb-4">
                        <Accordion className="divide-y divide-border/60 rounded-xl border border-border/40 bg-oboya-soft-white/50">
                          {items.map((faq) => (
                            <AccordionItem
                              key={faq.id}
                              value={faq.id}
                              className="border-0 px-3"
                            >
                              <AccordionTrigger className="py-3.5 text-sm font-medium text-oboya-blue-dark hover:no-underline">
                                {pickLocalized(faq.question, locale)}
                              </AccordionTrigger>
                              <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                                {pickLocalized(faq.answer, locale)}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
}
