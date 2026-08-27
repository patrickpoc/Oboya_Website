import "server-only";

import {
  getBlogCategories,
  replaceBlogCategoriesCache,
  saveBlogCategory as saveCategoryMemory,
  deleteBlogCategory as deleteCategoryMemory,
  type BlogCategory,
} from "@/lib/cms/repositories/blog-categories-repository";
import {
  readCmsDocumentData,
  writeCmsDocumentData,
} from "@/lib/cms/server/cms-document.server";

export const BLOG_CATEGORIES_DOC_ID = "blog-categories";

function isCategories(value: unknown): value is BlogCategory[] {
  return Array.isArray(value);
}

export async function readBlogCategoriesDurable(): Promise<BlogCategory[]> {
  const remote = await readCmsDocumentData(BLOG_CATEGORIES_DOC_ID);
  if (isCategories(remote)) {
    replaceBlogCategoriesCache(remote);
  }
  return getBlogCategories();
}

export async function saveBlogCategoryDurable(
  category: BlogCategory
): Promise<BlogCategory> {
  await readBlogCategoriesDurable();
  const saved = saveCategoryMemory(category);
  await writeCmsDocumentData(
    BLOG_CATEGORIES_DOC_ID,
    "blog",
    getBlogCategories()
  );
  return saved;
}

export async function deleteBlogCategoryDurable(id: string): Promise<boolean> {
  await readBlogCategoriesDurable();
  const ok = deleteCategoryMemory(id);
  if (ok) {
    await writeCmsDocumentData(
      BLOG_CATEGORIES_DOC_ID,
      "blog",
      getBlogCategories()
    );
  }
  return ok;
}
