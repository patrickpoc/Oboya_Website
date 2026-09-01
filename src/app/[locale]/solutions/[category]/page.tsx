import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteLayout } from "@/components/layouts/SiteLayout";
import { SolutionCategoryPageContent } from "@/components/solutions/SolutionCategoryPageContent";
import { routing } from "@/i18n/routing";
import { siteConfig } from "@/constants/site";
import {
  isSolutionCategoryId,
  SOLUTION_CATEGORY_IDS,
} from "@/lib/solutions/category-stages";

type Props = { params: Promise<{ locale: string; category: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    SOLUTION_CATEGORY_IDS.map((category) => ({ locale, category }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, category } = await params;
  if (!isSolutionCategoryId(category)) {
    return { title: "Not Found" };
  }

  const t = await getTranslations({ locale, namespace: "solutionsPage" });
  const title = t(`categories.${category}.title`);
  const description = t(`categories.${category}.description`);

  return {
    title,
    description,
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((loc) => [loc, `/${loc}/solutions/${category}`])
      ),
    },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
    },
  };
}

export default async function SolutionCategoryPage({ params }: Props) {
  const { locale, category } = await params;
  setRequestLocale(locale);

  if (!isSolutionCategoryId(category)) {
    notFound();
  }

  return (
    <SiteLayout>
      <SolutionCategoryPageContent categoryId={category} locale={locale} />
    </SiteLayout>
  );
}
