import "server-only";

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
  readCmsDocumentData,
  writeCmsDocumentData,
} from "@/lib/cms/server/cms-document.server";

export const FAQS_DOC_ID = "faqs";

type FaqsDoc = { categories: CmsFaqCategory[]; faqs: CmsFaqItem[] };

function isFaqsDoc(value: unknown): value is FaqsDoc {
  if (!value || typeof value !== "object") return false;
  const doc = value as FaqsDoc;
  return Array.isArray(doc.categories) && Array.isArray(doc.faqs);
}

async function persistCurrent(): Promise<FaqsDoc> {
  const doc = { categories: getCategories(), faqs: getFaqs() };
  await writeCmsDocumentData(FAQS_DOC_ID, "website", doc);
  return doc;
}

export async function readFaqsDurable(): Promise<FaqsDoc> {
  const remote = await readCmsDocumentData(FAQS_DOC_ID);
  if (isFaqsDoc(remote)) {
    replaceFaqsCache(remote);
  }
  return { categories: getCategories(), faqs: getFaqs() };
}

export async function saveFaqCategoryDurable(
  category: CmsFaqCategory
): Promise<CmsFaqCategory> {
  await readFaqsDurable();
  const saved = saveCategoryMemory(category);
  await persistCurrent();
  return saved;
}

export async function saveFaqItemDurable(faq: CmsFaqItem): Promise<CmsFaqItem> {
  await readFaqsDurable();
  const saved = saveFaqMemory(faq);
  await persistCurrent();
  return saved;
}

export async function deleteFaqCategoryDurable(id: string): Promise<boolean> {
  await readFaqsDurable();
  const ok = deleteCategoryMemory(id);
  if (ok) await persistCurrent();
  return ok;
}

export async function deleteFaqItemDurable(id: string): Promise<boolean> {
  await readFaqsDurable();
  const ok = deleteFaqMemory(id);
  if (ok) await persistCurrent();
  return ok;
}
