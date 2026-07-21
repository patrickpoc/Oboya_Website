"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogFeaturedHero } from "@/components/blog/BlogFeaturedHero";
import type { CmsBlogPost } from "@/lib/cms/repositories/blog-repository";
import type { BlogCategory } from "@/lib/cms/repositories/blog-categories-repository";
import { pickLocalized } from "@/lib/cms/utils";
import { cn } from "@/lib/utils";

interface BlogPageContentProps {
  posts: CmsBlogPost[];
  categories: BlogCategory[];
  locale: string;
}

function formatBlogDate(isoDate: string | undefined, locale: string): string {
  if (!isoDate) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(new Date(isoDate))
    .toUpperCase();
}

export function BlogPageContent({ posts, categories, locale }: BlogPageContentProps) {
  const t = useTranslations("blog");
  const [categoryId, setCategoryId] = useState("all");

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

  const featuredPost = filteredPosts[0];
  const gridPosts = filteredPosts.slice(1);
  const showCategoryFilters = categories.length > 0;

  return (
    <>
      <section className="bg-oboya-blue-dark text-white">
        <Container className="py-12 md:py-16 lg:py-20">
          <div className="max-w-5xl">
            <p className="text-sm font-medium tracking-[0.2em] text-white/70 uppercase">
              {t("eyebrow")}
            </p>
            <div className="mt-4 h-px w-full max-w-4xl bg-oboya-blue/60" />
            <h1 className="mt-8 font-display text-3xl leading-tight font-black tracking-tight text-balance md:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              {t("title")}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg">
              {t("description")}
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-oboya-soft-white py-12 md:py-16 lg:py-20">
        <Container>
          {showCategoryFilters && (
            <div className="mb-10 md:mb-12">
              <p className="sr-only">{t("filterLabel")}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryId("all")}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    categoryId === "all"
                      ? "border-oboya-blue-dark bg-oboya-blue-dark text-white"
                      : "border-border/80 bg-white text-oboya-blue-dark hover:border-oboya-blue/40"
                  )}
                >
                  {t("allPosts")}
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryId(category.id)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                      categoryId === category.id
                        ? "border-oboya-blue-dark bg-oboya-blue-dark text-white"
                        : "border-border/80 bg-white text-oboya-blue-dark hover:border-oboya-blue/40"
                    )}
                  >
                    {pickLocalized(category.name, locale)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredPosts.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">
              {categoryId === "all" ? t("emptyAll") : t("empty")}
            </p>
          ) : (
            <div className="space-y-10 md:space-y-14">
              {featuredPost && (
                <BlogFeaturedHero
                  slug={featuredPost.slug}
                  title={pickLocalized(featuredPost.title, locale)}
                  excerpt={pickLocalized(featuredPost.excerpt, locale)}
                  categoryLabel={
                    categoryMap.get(featuredPost.categoryId) ?? t("articleLabel")
                  }
                  date={formatBlogDate(featuredPost.publishedAt, locale)}
                  author={featuredPost.author}
                  featuredLabel={t("featuredLabel")}
                  readMoreLabel={t("readMore")}
                  image={featuredPost.featuredImage}
                />
              )}

              {gridPosts.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {gridPosts.map((post) => (
                    <BlogCard
                      key={post.id}
                      slug={post.slug}
                      title={pickLocalized(post.title, locale)}
                      excerpt={pickLocalized(post.excerpt, locale)}
                      categoryLabel={categoryMap.get(post.categoryId) ?? t("articleLabel")}
                      date={formatBlogDate(post.publishedAt, locale)}
                      author={post.author}
                      image={post.featuredImage}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
