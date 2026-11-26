"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { PageIntroBanner } from "@/components/ui/PageIntroBanner";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogFeaturedHero } from "@/components/blog/BlogFeaturedHero";
import { Pagination } from "@/components/news/Pagination";
import type { CmsBlogPost } from "@/lib/cms/repositories/blog-repository";
import {
  pickFeaturedPost,
  sortBlogPostsForDisplay,
} from "@/lib/cms/repositories/blog-repository";
import { categoriesForScope, type BlogCategory } from "@/lib/cms/repositories/blog-categories-repository";
import type { NewsPageSettings } from "@/lib/cms/repositories/news-page-repository";
import { pickLocalized } from "@/lib/cms/utils";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | string;

interface NewsPageContentProps {
  posts: CmsBlogPost[];
  categories: BlogCategory[];
  settings: NewsPageSettings;
  locale: string;
}

function formatNewsDate(isoDate: string | undefined, locale: string): string {
  if (!isoDate) return "";
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(new Date(isoDate))
    .toUpperCase();
}

export function NewsPageContent({ posts, categories, settings, locale }: NewsPageContentProps) {
  const t = useTranslations("newsPage");
  const tb = useTranslations("blog");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = settings.postsPerPage || 6;

  const newsCategories = useMemo(
    () => categoriesForScope(categories, "news"),
    [categories]
  );

  // Sync from ?category= after mount (same approach as the blog page).
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("category");
    const match = newsCategories.find((c) => c.id === param);
    if (match) setCategory(match.id); // eslint-disable-line react-hooks/set-state-in-effect
  }, [newsCategories]);

  const selectCategory = (next: CategoryFilter) => {
    setCategory(next);
    setCurrentPage(1);
    const url = new URL(window.location.href);
    if (next === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", next);
    window.history.replaceState(null, "", url);
  };

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, pickLocalized(c.name, locale)])),
    [categories, locale]
  );

  const filteredPosts = useMemo(() => {
    const sorted = sortBlogPostsForDisplay(posts);
    if (category === "all") return sorted;
    return sorted.filter((post) => post.categoryId === category);
  }, [posts, category]);

  const featuredPost = pickFeaturedPost(filteredPosts);
  const gridPosts = filteredPosts.filter((p) => p !== featuredPost);

  const totalPages = Math.max(1, Math.ceil(gridPosts.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedPosts = gridPosts.slice((safePage - 1) * pageSize, safePage * pageSize);

  const filters: { id: CategoryFilter; label: string }[] = [
    { id: "all", label: t("categoryAll") },
    ...newsCategories.map((c) => ({ id: c.id, label: pickLocalized(c.name, locale) })),
  ];

  return (
    <>
      <PageIntroBanner
        title={pickLocalized(settings.title, locale) || t("title")}
        body={pickLocalized(settings.subtitle, locale) || t("description")}
      />

      <section className="bg-oboya-soft-white py-10 md:py-14 lg:py-16">
        <Container>
          <p className="mb-6 max-w-3xl font-body text-base text-oboya-blue-dark md:text-lg">
            {pickLocalized(settings.intro, locale) || t("intro")}
          </p>
          <nav aria-label={t("filterLabel")} className="mb-8 flex flex-wrap gap-2 md:mb-10">
            {filters.map((filter) => {
              const isActive = filter.id === category;
              return (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => selectCategory(filter.id)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 font-body text-[0.8125rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oboya-blue md:text-sm",
                    isActive
                      ? "bg-oboya-blue text-white"
                      : "bg-white text-oboya-blue hover:bg-oboya-blue/10"
                  )}
                >
                  {filter.label}
                </button>
              );
            })}
          </nav>

          {filteredPosts.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">
              {category === "all" ? t("emptyAll") : t("empty")}
            </p>
          ) : (
            <div className="space-y-8 md:space-y-10">
              {featuredPost && (
                <BlogFeaturedHero
                  basePath="/news"
                  slug={featuredPost.slug}
                  title={pickLocalized(featuredPost.title, locale)}
                  excerpt={pickLocalized(featuredPost.excerpt, locale)}
                  categoryLabel={categoryMap.get(featuredPost.categoryId) ?? t("articleLabel")}
                  featuredLabel={tb("featuredLabel")}
                  readMoreLabel={tb("readMore")}
                  image={featuredPost.featuredImage}
                />
              )}

              {pagedPosts.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {pagedPosts.map((post) => (
                    <BlogCard
                      key={post.id}
                      basePath="/news"
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
                className="pt-4 md:pt-6"
                prevLabel={t("prevPage")}
                nextLabel={t("nextPage")}
              />
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
