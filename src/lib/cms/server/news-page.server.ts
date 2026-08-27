import "server-only";

import {
  getNewsPageSettings,
  replaceNewsPageSettingsCache,
  saveNewsPageSettings as saveMemory,
  type NewsPageSettings,
} from "@/lib/cms/repositories/news-page-repository";
import {
  readCmsDocumentData,
  writeCmsDocumentData,
} from "@/lib/cms/server/cms-document.server";

export const NEWS_PAGE_DOC_ID = "news-page";

function isNews(value: unknown): value is NewsPageSettings {
  return Boolean(
    value &&
      typeof value === "object" &&
      "headline" in value &&
      "postsPerPage" in value
  );
}

export async function readNewsPageSettingsDurable(): Promise<NewsPageSettings> {
  const remote = await readCmsDocumentData(NEWS_PAGE_DOC_ID);
  if (isNews(remote)) {
    replaceNewsPageSettingsCache(remote);
  }
  return getNewsPageSettings();
}

export async function saveNewsPageSettingsDurable(
  settings: NewsPageSettings
): Promise<NewsPageSettings> {
  await readNewsPageSettingsDurable();
  const saved = saveMemory(settings);
  await writeCmsDocumentData(NEWS_PAGE_DOC_ID, "website", saved);
  return saved;
}
