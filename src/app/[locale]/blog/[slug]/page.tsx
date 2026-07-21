import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { BlogPostContent } from "@/components/blog/BlogPostContent";
import { readBlogCategories, readBlogPostBySlug, readBlogPosts } from "@/lib/cms/readers";
import { pickLocalized } from "@/lib/cms/utils";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  const posts = readBlogPosts();
  return routing.locales.flatMap((locale) =>
    posts.map((post) => ({ locale, slug: post.slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = readBlogPostBySlug(slug);
  if (!post) return { title: "Not Found" };

  return {
    title: pickLocalized(post.title, locale),
    description: pickLocalized(post.excerpt, locale),
  };
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

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = readBlogPostBySlug(slug);
  if (!post) notFound();

  const t = await getTranslations("blog");
  const categories = readBlogCategories();
  const category = categories.find((c) => c.id === post.categoryId);
  const title = pickLocalized(post.title, locale);
  const excerpt = pickLocalized(post.excerpt, locale);
  const body = pickLocalized(post.body, locale);

  return (
    <SiteLayout>
      <BlogPostContent
        post={post}
        title={title}
        excerpt={excerpt}
        body={body}
        categoryLabel={category ? pickLocalized(category.name, locale) : t("articleLabel")}
        formattedDate={formatBlogDate(post.publishedAt, locale)}
        detailPlaceholder={t("detailPlaceholder")}
      />
    </SiteLayout>
  );
}
