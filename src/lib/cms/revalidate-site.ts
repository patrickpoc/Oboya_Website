import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/routing";
import { DEFER_REVALIDATE_HEADER } from "@/lib/cms/revalidate-headers";

export { DEFER_REVALIDATE_HEADER } from "@/lib/cms/revalidate-headers";

/**
 * Safety ISR window (seconds) for public pages.
 * On-demand `revalidatePath` after CMS saves remains the primary invalidation.
 * This TTL is only a fallback if a write path forgets to bust cache.
 */
export const SITE_REVALIDATE_SECONDS = 86400;
function forEachLocale(run: (locale: string) => void) {
  for (const locale of locales) {
    run(locale);
  }
}

export function shouldDeferRevalidate(request: Request): boolean {
  return request.headers.get(DEFER_REVALIDATE_HEADER) === "1";
}

/**
 * Bust the root locale layout tree.
 * Prefer page-scoped helpers below — layout invalidation is expensive under
 * concurrent admin writes.
 */
export function revalidateSiteLayout() {
  revalidatePath("/", "layout");
}

export function revalidateHomePages() {
  forEachLocale((locale) => {
    revalidatePath(`/${locale}`);
  });
}

export function revalidateAboutPages() {
  forEachLocale((locale) => {
    revalidatePath(`/${locale}/about`);
  });
}

/** Map UI lives on About; keep /map redirect warm too. */
export function revalidateMapPages() {
  revalidateAboutPages();
  forEachLocale((locale) => {
    revalidatePath(`/${locale}/map`);
  });
}

export function revalidateCaseStudyPages(slug?: string) {
  forEachLocale((locale) => {
    revalidatePath(`/${locale}/case-studies`);
    if (slug) {
      revalidatePath(`/${locale}/case-studies/${slug}`);
    }
  });
}

export function revalidateBlogPages(slug?: string) {
  forEachLocale((locale) => {
    revalidatePath(`/${locale}/blog`);
    revalidatePath(`/${locale}/news`);
    if (slug) {
      revalidatePath(`/${locale}/blog/${slug}`);
    }
  });
}

export function revalidateFaqPages() {
  forEachLocale((locale) => {
    revalidatePath(`/${locale}/faqs`);
  });
}

export function revalidateSolutionsPages() {
  forEachLocale((locale) => {
    revalidatePath(`/${locale}/solutions`);
  });
}

export function revalidateNewsPages() {
  forEachLocale((locale) => {
    revalidatePath(`/${locale}/news`);
  });
}

// Shop/product freshness is tag-based: see cache-invalidation.server.ts.
