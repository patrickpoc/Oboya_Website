"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { FaqTopicAccordion } from "@/components/faqs/FaqTopicAccordion";
import { matchesFaqSearch } from "@/lib/faq-search";
import { pickLocalized } from "@/lib/cms/utils";
import type {
  CmsFaqCategory,
  CmsFaqItem,
} from "@/lib/cms/repositories/faqs-repository";

interface FaqViewCategory {
  category: CmsFaqCategory;
  items: CmsFaqItem[];
}

interface FaqsPageViewProps {
  locale: string;
  categories: CmsFaqCategory[];
  faqs: CmsFaqItem[];
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
      const matched = matchesFaqSearch(
        search,
        pickLocalized(faq.question, locale),
        pickLocalized(faq.answer, locale),
        categoryTitle,
        faq.keywords.join(" ")
      );
      if (!matched) continue;

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
    <>
      <section className="bg-oboya-blue-dark pt-[clamp(3.5rem,8vw,5.5rem)] pb-12 md:pb-16">
        <Container>
          <div className="max-w-4xl">
            <div className="mb-5 h-px w-16 bg-white/35" aria-hidden />
            <p className="font-body text-base font-normal leading-relaxed text-white/75 md:text-lg">
              {t("heroSubtitle")}
            </p>
            <h1 className="mt-5 font-display text-[clamp(3.25rem,10vw,6.5rem)] font-light leading-none tracking-[-0.03em] text-white">
              {t("heroTitle")}
            </h1>
          </div>
        </Container>
        <div className="mt-10 h-px w-full bg-white/15" aria-hidden />
      </section>

      <section className="bg-white py-[clamp(2.5rem,6vw,4.5rem)]">
        <Container size="wide">
          <div className="mb-14 md:mb-16">
            <div className="relative mx-auto w-full max-w-2xl">
              <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-oboya-green sm:size-5" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="h-14 rounded-none border-oboya-blue-dark/15 bg-oboya-soft-white pl-12 text-base font-normal text-oboya-blue-dark sm:pl-14"
                aria-label={t("searchPlaceholder")}
              />
            </div>
            <div className="mt-7 h-px w-full bg-[#A3C9A8] md:mt-9" aria-hidden />
          </div>

          {totalMatches === 0 ? (
            <p className="border border-oboya-blue-dark/10 bg-oboya-soft-white px-5 py-10 text-center text-base font-normal text-oboya-blue-dark/55">
              {t("noResults")}
            </p>
          ) : (
            <div className="space-y-16 md:space-y-20 lg:space-y-24">
              {grouped.map(({ category, items }) => {
                const categoryTitle = pickLocalized(category.title, locale);

                return (
                  <div
                    key={category.id}
                    className="grid items-start gap-8 lg:grid-cols-[minmax(14rem,0.38fr)_1fr] lg:gap-14 xl:gap-20"
                  >
                    {/* Aligns with first question row / + (same border + padding as trigger) */}
                    <div className="flex items-center border-t border-transparent pt-px lg:sticky lg:top-28 lg:self-start lg:border-[#A3C9A8]/70 lg:py-7">
                      <h2 className="font-display text-[clamp(1.65rem,3vw,2.5rem)] font-bold leading-[1.15] tracking-tight text-oboya-blue-dark">
                        {categoryTitle}
                      </h2>
                    </div>

                    <FaqTopicAccordion items={items} locale={locale} />
                  </div>
                );
              })}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
