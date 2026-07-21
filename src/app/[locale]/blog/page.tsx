import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { BlogPageContent } from "@/components/blog/BlogPageContent";
import { readBlogCategories, readBlogPosts } from "@/lib/cms/readers";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function BlogIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const posts = readBlogPosts();
  const categories = readBlogCategories();

  return (
    <SiteLayout>
      <BlogPageContent posts={posts} categories={categories} locale={locale} />
    </SiteLayout>
  );
}
