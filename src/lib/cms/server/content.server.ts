import "server-only";

import {
  getAboutPageSettings,
  replaceAboutPageSettingsCache,
  saveAboutPageSettings as saveAboutMemory,
  type AboutPageSettings,
} from "@/lib/cms/repositories/about-page-repository";
import {
  getBlogPosts,
  replaceBlogPostsCache,
  saveBlogPost as saveBlogMemory,
  deleteBlogPost as deleteBlogMemory,
  type CmsBlogPost,
} from "@/lib/cms/repositories/blog-repository";
import {
  getCaseStudies,
  replaceCaseStudiesCache,
  saveCaseStudy as saveCaseMemory,
  deleteCaseStudy as deleteCaseMemory,
  type CmsCaseStudy,
} from "@/lib/cms/repositories/case-studies-repository";
import {
  getCategories,
  getFaqs,
  replaceFaqsCache,
  saveCategory as saveCategoryMemory,
  saveFaq as saveFaqMemory,
  deleteCategory as deleteCategoryMemory,
  deleteFaq as deleteFaqMemory,
  type CmsFaqCategory,
  type CmsFaqItem,
} from "@/lib/cms/repositories/faqs-repository";
import {
  getNewsPageSettings,
  replaceNewsPageSettingsCache,
  saveNewsPageSettings as saveNewsMemory,
  type NewsPageSettings,
} from "@/lib/cms/repositories/news-page-repository";
import {
  getMediaAssets,
  replaceMediaAssetsCache,
  saveMediaAsset as saveMediaMemory,
  deleteMediaAsset as deleteMediaMemory,
} from "@/lib/cms/repositories/media-repository";
import type { MediaAsset } from "@/lib/cms/types";
import {
  readCmsJsonFile,
  writeCmsJsonFile,
} from "@/lib/cms/server/cms-file.server";

const FILES = {
  about: "about-settings.json",
  news: "news-page-settings.json",
  faqs: "faqs.json",
  blog: "blog-posts.json",
  cases: "case-studies.json",
  media: "media-assets.json",
} as const;

const hydrated = {
  about: false,
  news: false,
  faqs: false,
  blog: false,
  cases: false,
  media: false,
};

async function hydrateAbout() {
  if (hydrated.about) return;
  hydrated.about = true;
  const data = await readCmsJsonFile<AboutPageSettings>(FILES.about);
  if (data) replaceAboutPageSettingsCache(data);
}

async function hydrateNews() {
  if (hydrated.news) return;
  hydrated.news = true;
  const data = await readCmsJsonFile<NewsPageSettings>(FILES.news);
  if (data) replaceNewsPageSettingsCache(data);
}

async function hydrateFaqs() {
  if (hydrated.faqs) return;
  hydrated.faqs = true;
  const data = await readCmsJsonFile<{
    categories: CmsFaqCategory[];
    faqs: CmsFaqItem[];
  }>(FILES.faqs);
  if (data?.categories && data?.faqs) replaceFaqsCache(data);
}

async function hydrateBlog() {
  if (hydrated.blog) return;
  hydrated.blog = true;
  const data = await readCmsJsonFile<CmsBlogPost[]>(FILES.blog);
  if (Array.isArray(data)) replaceBlogPostsCache(data);
}

async function hydrateCases() {
  if (hydrated.cases) return;
  hydrated.cases = true;
  const data = await readCmsJsonFile<CmsCaseStudy[]>(FILES.cases);
  if (Array.isArray(data)) replaceCaseStudiesCache(data);
}

async function hydrateMedia() {
  if (hydrated.media) return;
  hydrated.media = true;
  const data = await readCmsJsonFile<MediaAsset[]>(FILES.media);
  if (Array.isArray(data) && data.length > 0) replaceMediaAssetsCache(data);
}

async function persistFaqs() {
  await writeCmsJsonFile(FILES.faqs, {
    categories: getCategories(),
    faqs: getFaqs(),
  });
}

export async function readAboutDurable() {
  await hydrateAbout();
  return getAboutPageSettings();
}

export async function saveAboutDurable(settings: AboutPageSettings) {
  await hydrateAbout();
  const saved = saveAboutMemory(settings);
  try {
    await writeCmsJsonFile(FILES.about, saved);
  } catch {
    /* keep memory */
  }
  return saved;
}

export async function readNewsDurable() {
  await hydrateNews();
  return getNewsPageSettings();
}

export async function saveNewsDurable(settings: NewsPageSettings) {
  await hydrateNews();
  const saved = saveNewsMemory(settings);
  try {
    await writeCmsJsonFile(FILES.news, saved);
  } catch {
    /* keep memory */
  }
  return saved;
}

export async function readFaqsDurable() {
  await hydrateFaqs();
  return { categories: getCategories(), faqs: getFaqs() };
}

export async function saveFaqCategoryDurable(category: CmsFaqCategory) {
  await hydrateFaqs();
  const saved = saveCategoryMemory(category);
  try {
    await persistFaqs();
  } catch {
    /* keep memory */
  }
  return saved;
}

export async function saveFaqItemDurable(faq: CmsFaqItem) {
  await hydrateFaqs();
  const saved = saveFaqMemory(faq);
  try {
    await persistFaqs();
  } catch {
    /* keep memory */
  }
  return saved;
}

export async function deleteFaqCategoryDurable(id: string) {
  await hydrateFaqs();
  const ok = deleteCategoryMemory(id);
  try {
    await persistFaqs();
  } catch {
    /* keep memory */
  }
  return ok;
}

export async function deleteFaqItemDurable(id: string) {
  await hydrateFaqs();
  const ok = deleteFaqMemory(id);
  try {
    await persistFaqs();
  } catch {
    /* keep memory */
  }
  return ok;
}

export async function readBlogDurable() {
  await hydrateBlog();
  return getBlogPosts();
}

export async function saveBlogDurable(post: CmsBlogPost) {
  await hydrateBlog();
  const saved = saveBlogMemory(post);
  try {
    await writeCmsJsonFile(FILES.blog, getBlogPosts());
  } catch {
    /* keep memory */
  }
  return saved;
}

export async function deleteBlogDurable(id: string) {
  await hydrateBlog();
  const ok = deleteBlogMemory(id);
  try {
    await writeCmsJsonFile(FILES.blog, getBlogPosts());
  } catch {
    /* keep memory */
  }
  return ok;
}

export async function readCasesDurable() {
  await hydrateCases();
  return getCaseStudies();
}

export async function saveCaseDurable(study: CmsCaseStudy) {
  await hydrateCases();
  const saved = saveCaseMemory(study);
  try {
    await writeCmsJsonFile(FILES.cases, getCaseStudies());
  } catch {
    /* keep memory */
  }
  return saved;
}

export async function deleteCaseDurable(id: string) {
  await hydrateCases();
  const ok = deleteCaseMemory(id);
  try {
    await writeCmsJsonFile(FILES.cases, getCaseStudies());
  } catch {
    /* keep memory */
  }
  return ok;
}

export async function readMediaDurable() {
  await hydrateMedia();
  return getMediaAssets();
}

export async function saveMediaDurable(asset: MediaAsset) {
  await hydrateMedia();
  const saved = saveMediaMemory(asset);
  try {
    await writeCmsJsonFile(FILES.media, getMediaAssets());
  } catch {
    /* keep memory */
  }
  return saved;
}

export async function deleteMediaDurable(id: string) {
  await hydrateMedia();
  const ok = deleteMediaMemory(id);
  try {
    await writeCmsJsonFile(FILES.media, getMediaAssets());
  } catch {
    /* keep memory */
  }
  return ok;
}
