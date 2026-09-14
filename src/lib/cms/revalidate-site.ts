import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/routing";

/**
 * Safety ISR window (seconds) for public pages.
 * On-demand `revalidatePath` after CMS saves remains the primary invalidation.
 * This TTL is only a fallback if a write path forgets to bust cache.
 */
export const SITE_REVALIDATE_SECONDS = 3600;

function forEachLocale(run: (locale: string) => void) {
  for (const locale of locales) {
    run(locale);
  }
}

/** Bust the root locale layout tree. */
export function revalidateSiteLayout() {
  revalidatePath("/", "layout");
}

export function revalidateHomePages() {
  revalidateSiteLayout();
  forEachLocale((locale) => {
    revalidatePath(`/${locale}`);
  });
}

export function revalidateAboutPages() {
  revalidateSiteLayout();
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
  revalidateSiteLayout();
  forEachLocale((locale) => {
    revalidatePath(`/${locale}/case-studies`);
    if (slug) {
      revalidatePath(`/${locale}/case-studies/${slug}`);
    }
  });
}

export function revalidateBlogPages(slug?: string) {
  revalidateSiteLayout();
  forEachLocale((locale) => {
    revalidatePath(`/${locale}/blog`);
    revalidatePath(`/${locale}/news`);
    if (slug) {
      revalidatePath(`/${locale}/blog/${slug}`);
    }
  });
}

export function revalidateFaqPages() {
  revalidateSiteLayout();
  forEachLocale((locale) => {
    revalidatePath(`/${locale}/faqs`);
  });
}

export function revalidateNewsPages() {
  revalidateSiteLayout();
  forEachLocale((locale) => {
    revalidatePath(`/${locale}/news`);
  });
}

export function revalidateShopPages(productId?: string) {
  revalidateSiteLayout();
  revalidatePath("/api/cms/products");
  revalidatePath("/api/cms/marketplace/filters");
  revalidatePath("/api/cms/marketplace/currencies");
  forEachLocale((locale) => {
    revalidatePath(`/${locale}/shop`);
    revalidatePath(`/${locale}/shop/cart`);
    revalidatePath(`/${locale}/shop/checkout`);
    if (productId) {
      revalidatePath(`/${locale}/shop/products/${productId}`);
    }
  });
}
