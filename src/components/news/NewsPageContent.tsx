"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/container";
import { NewsCard } from "@/components/news/NewsCard";
import { Pagination } from "@/components/news/Pagination";
import type { CmsBlogPost } from "@/lib/cms/repositories/blog-repository";
import type { BlogCategory } from "@/lib/cms/repositories/blog-categories-repository";
import type { NewsPageSettings } from "@/lib/cms/repositories/news-page-repository";
import { pickLocalized } from "@/lib/cms/utils";

interface NewsPageContentProps {
  posts: CmsBlogPost[];
  categories: BlogCategory[];
  settings: NewsPageSettings;
  locale: string;
}

function formatNewsDate(isoDate: string | undefined, locale: string): string {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(date)
    .toUpperCase();
}

export function NewsPageContent({
  posts,
  categories,
  settings,
  locale,
}: NewsPageContentProps) {
  const t = useTranslations("newsPage");
  const [categoryId, setCategoryId] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const eyebrow = pickLocalized(settings.eyebrow, locale);
  const headline = pickLocalized(settings.headline, locale);
  const pageSize = settings.postsPerPage || 6;

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, pickLocalized(c.name, locale)])),
    [categories, locale]
  );

  const filteredPosts = useMemo(() => {
    const sorted = [...posts].sort(
      (a, b) =>
        new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime()
    );
    if (categoryId === "all") return sorted;
    return sorted.filter((post) => post.categoryId === categoryId);
  }, [posts, categoryId]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedPosts = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredPosts.slice(start, start + pageSize);
  }, [filteredPosts, safePage, pageSize]);

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setCurrentPage(1);
  };

  return (
    <>
      <section className="bg-oboya-blue-dark text-white">
        <Container className="py-12 md:py-16 lg:py-20">
          <div className="max-w-5xl">
            <p className="text-sm font-medium tracking-[0.2em] text-white/70 uppercase">
              {eyebrow}
            </p>
            <div className="mt-4 h-px w-full max-w-4xl bg-oboya-blue/60" />
            <h1 className="mt-8 font-display text-3xl leading-tight font-black tracking-tight text-balance md:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              {headline}
            </h1>
          </div>

          <div className="mt-10 md:mt-14">
            <label className="relative inline-flex min-w-[11rem]">
              <span className="sr-only">{t("filterLabel")}</span>
              <select
                value={categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="h-11 w-full appearance-none rounded-none border border-white/40 bg-transparent px-4 pr-10 text-sm font-medium text-white focus:border-white focus:outline-none"
              >
                <option value="all" className="text-oboya-blue-dark">
                  {t("allNews")}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id} className="text-oboya-blue-dark">
                    {pickLocalized(category.name, locale)}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-white/80"
              />
            </label>
          </div>
        </Container>
      </section>

      <section className="bg-oboya-soft-white py-12 md:py-16 lg:py-20">
        <Container>
          {paginatedPosts.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">{t("empty")}</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedPosts.map((post) => (
                <NewsCard
                  key={post.id}
                  slug={post.slug}
                  title={pickLocalized(post.title, locale)}
                  categoryLabel={categoryMap.get(post.categoryId) ?? t("articleLabel")}
                  date={formatNewsDate(post.publishedAt, locale)}
                  image={post.featuredImage}
                />
              ))}
            </div>
          )}

          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="mt-12 md:mt-16"
            prevLabel={t("prevPage")}
            nextLabel={t("nextPage")}
          />
        </Container>
      </section>
    </>
  );
}
