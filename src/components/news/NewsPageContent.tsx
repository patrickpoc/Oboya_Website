"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { PageIntroBanner } from "@/components/ui/PageIntroBanner";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogFeaturedHero } from "@/components/blog/BlogFeaturedHero";
import { Pagination } from "@/components/news/Pagination";
import type { BlogCropId, CmsBlogPost } from "@/lib/cms/repositories/blog-repository";
import {
  BLOG_CROP_IDS,
  pickFeaturedPost,
  sortBlogPostsForDisplay,
} from "@/lib/cms/repositories/blog-repository";
import type { BlogCategory } from "@/lib/cms/repositories/blog-categories-repository";
import type { NewsPageSettings } from "@/lib/cms/repositories/news-page-repository";
import { pickLocalized } from "@/lib/cms/utils";
import { cn } from "@/lib/utils";

type CropFilter = "all" | BlogCropId;

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
  const [crop, setCrop] = useState<CropFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const cmsHeadline = pickLocalized(settings.headline, locale).trim();
  const subtitle =
    cmsHeadline && !/^lorem ipsum/i.test(cmsHeadline) ? cmsHeadline : t("description");
  const pageSize = settings.postsPerPage || 6;

  // Sync from ?crop= after mount (same approach as the blog page).
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("crop");
    const match = BLOG_CROP_IDS.find((c) => c === param);
    if (match) setCrop(match); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  const selectCrop = (next: CropFilter) => {
    setCrop(next);
    setCurrentPage(1);
    const url = new URL(window.location.href);
    if (next === "all") url.searchParams.delete("crop");
    else url.searchParams.set("crop", next);
    window.history.replaceState(null, "", url);
  };

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, pickLocalized(c.name, locale)])),
    [categories, locale]
  );

  const filteredPosts = useMemo(() => {
    const sorted = sortBlogPostsForDisplay(posts);
    if (crop === "all") return sorted;
    return sorted.filter((post) => post.crops.includes(crop));
  }, [posts, crop]);

  const featuredPost = pickFeaturedPost(filteredPosts);
  const gridPosts = filteredPosts.filter((p) => p !== featuredPost);

  const totalPages = Math.max(1, Math.ceil(gridPosts.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedPosts = gridPosts.slice((safePage - 1) * pageSize, safePage * pageSize);

  const filters: { id: CropFilter; label: string }[] = [
    { id: "all", label: tb("cropAll") },
    { id: "flowers", label: tb("cropFlowers") },
    { id: "vegetables", label: tb("cropVegetables") },
    { id: "fruits", label: tb("cropFruits") },
  ];

  return (
    <>
      <PageIntroBanner title={t("title")} body={subtitle} />

      <section className="bg-oboya-soft-white py-10 md:py-14 lg:py-16">
        <Container>
          <nav aria-label={t("filterLabel")} className="mb-8 flex flex-wrap gap-2 md:mb-10">
            {filters.map((filter) => {
              const isActive = filter.id === crop;
              return (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => selectCrop(filter.id)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 font-body text-[0.8125rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oboya-green md:text-sm",
                    isActive
                      ? "bg-oboya-green text-white"
                      : "bg-white text-oboya-green hover:bg-oboya-green/15"
                  )}
                >
                  {filter.label}
                </button>
              );
            })}
          </nav>

          {filteredPosts.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">
              {crop === "all" ? t("emptyAll") : t("empty")}
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
