import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import {
  isSolutionCategoryId,
  SOLUTION_CATEGORY_IDS,
} from "@/lib/solutions/category-stages";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string; category: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    SOLUTION_CATEGORY_IDS.map((category) => ({ locale, category }))
  );
}

/**
 * Category subroutes redirect into the one-page Solutions experience.
 * Uses `?area=` (not hash) so the server redirect remains reliable.
 */
export default async function SolutionCategoryPage({ params }: Props) {
  const { locale, category } = await params;
  setRequestLocale(locale);

  if (!isSolutionCategoryId(category)) {
    redirect(`/${locale}/solutions`);
  }

  redirect(`/${locale}/solutions?area=${category}`);
}
