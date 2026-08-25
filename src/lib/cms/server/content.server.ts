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

/**
 * Disk is the shared source of truth across Next.js API and RSC bundles
 * (module memory is not shared between them).
 */
async function loadAboutFromDisk() {
  const data = await readCmsJsonFile<AboutPageSettings>(FILES.about);
  if (data) replaceAboutPageSettingsCache(data);
}

async function loadNewsFromDisk() {
  const data = await readCmsJsonFile<NewsPageSettings>(FILES.news);
  if (data) replaceNewsPageSettingsCache(data);
}

async function loadFaqsFromDisk() {
  const data = await readCmsJsonFile<{
    categories: CmsFaqCategory[];
    faqs: CmsFaqItem[];
  }>(FILES.faqs);
  if (data?.categories && data?.faqs) replaceFaqsCache(data);
}

async function loadBlogFromDisk() {
  const data = await readCmsJsonFile<CmsBlogPost[]>(FILES.blog);
  if (Array.isArray(data)) replaceBlogPostsCache(data);
}

async function loadCasesFromDisk() {
  const data = await readCmsJsonFile<CmsCaseStudy[]>(FILES.cases);
  if (Array.isArray(data)) replaceCaseStudiesCache(data);
}

async function loadMediaFromDisk() {
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
  await loadAboutFromDisk();
  return getAboutPageSettings();
}

export async function saveAboutDurable(settings: AboutPageSettings) {
  await loadAboutFromDisk();
  const saved = saveAboutMemory(settings);
  try {
    await writeCmsJsonFile(FILES.about, saved);
  } catch {
    /* keep memory */
  }
  return saved;
}

export async function readNewsDurable() {
  await loadNewsFromDisk();
  return getNewsPageSettings();
}

export async function saveNewsDurable(settings: NewsPageSettings) {
  await loadNewsFromDisk();
  const saved = saveNewsMemory(settings);
  try {
    await writeCmsJsonFile(FILES.news, saved);
  } catch {
    /* keep memory */
  }
  return saved;
}

export async function readFaqsDurable() {
  await loadFaqsFromDisk();
  return { categories: getCategories(), faqs: getFaqs() };
}

export async function saveFaqCategoryDurable(category: CmsFaqCategory) {
  await loadFaqsFromDisk();
  const saved = saveCategoryMemory(category);
  try {
    await persistFaqs();
  } catch {
    /* keep memory */
  }
  return saved;
}

export async function saveFaqItemDurable(faq: CmsFaqItem) {
  await loadFaqsFromDisk();
  const saved = saveFaqMemory(faq);
  try {
    await persistFaqs();
  } catch {
    /* keep memory */
  }
  return saved;
}

export async function deleteFaqCategoryDurable(id: string) {
  await loadFaqsFromDisk();
  const ok = deleteCategoryMemory(id);
  try {
    await persistFaqs();
  } catch {
    /* keep memory */
  }
  return ok;
}

export async function deleteFaqItemDurable(id: string) {
  await loadFaqsFromDisk();
  const ok = deleteFaqMemory(id);
  try {
    await persistFaqs();
  } catch {
    /* keep memory */
  }
  return ok;
}

export async function readBlogDurable() {
  await loadBlogFromDisk();
  return getBlogPosts();
}

export async function saveBlogDurable(post: CmsBlogPost) {
  await loadBlogFromDisk();
  const saved = saveBlogMemory(post);
  try {
    await writeCmsJsonFile(FILES.blog, getBlogPosts());
  } catch {
    /* keep memory */
  }
  return saved;
}

export async function deleteBlogDurable(id: string) {
  await loadBlogFromDisk();
  const ok = deleteBlogMemory(id);
  try {
    await writeCmsJsonFile(FILES.blog, getBlogPosts());
  } catch {
    /* keep memory */
  }
  return ok;
}

export async function readCasesDurable() {
  await loadCasesFromDisk();
  return getCaseStudies();
}

export async function saveCaseDurable(study: CmsCaseStudy) {
  await loadCasesFromDisk();
  const saved = saveCaseMemory(study);
  try {
    await writeCmsJsonFile(FILES.cases, getCaseStudies());
  } catch {
    /* keep memory */
  }
  return saved;
}

export async function deleteCaseDurable(id: string) {
  await loadCasesFromDisk();
  const ok = deleteCaseMemory(id);
  try {
    await writeCmsJsonFile(FILES.cases, getCaseStudies());
  } catch {
    /* keep memory */
  }
  return ok;
}

export async function readMediaDurable() {
  await loadMediaFromDisk();
  return getMediaAssets();
}

export async function saveMediaDurable(asset: MediaAsset) {
  await loadMediaFromDisk();
  const saved = saveMediaMemory(asset);
  try {
    await writeCmsJsonFile(FILES.media, getMediaAssets());
  } catch {
    /* keep memory */
  }
  return saved;
}

export async function deleteMediaDurable(id: string) {
  await loadMediaFromDisk();
  const ok = deleteMediaMemory(id);
  try {
    await writeCmsJsonFile(FILES.media, getMediaAssets());
  } catch {
    /* keep memory */
  }
  return ok;
}
