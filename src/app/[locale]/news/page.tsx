import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { NewsPageContent } from "@/components/news/NewsPageContent";
import {
  readBlogCategories,
  readBlogPosts,
  readNewsPageSettings,
} from "@/lib/cms/readers";
import { pickLocalized } from "@/lib/cms/utils";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const settings = readNewsPageSettings();
  const t = await getTranslations({ locale, namespace: "newsPage" });

  return {
    title: t("metaTitle"),
    description: pickLocalized(settings.headline, locale),
  };
}

export default async function NewsIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const posts = readBlogPosts();
  const categories = readBlogCategories();
  const settings = readNewsPageSettings();

  return (
    <SiteLayout>
      <NewsPageContent
        posts={posts}
        categories={categories}
        settings={settings}
        locale={locale}
      />
    </SiteLayout>
  );
}
