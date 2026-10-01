import "server-only";

import {
  getAboutPageSettings,
  replaceAboutPageSettingsCache,
  saveAboutPageSettings as saveMemory,
  type AboutPageSettings,
} from "@/lib/cms/repositories/about-page-repository";
import {
  readCmsDocumentData,
  writeCmsDocumentData,
} from "@/lib/cms/server/cms-document.server";

export const ABOUT_DOC_ID = "about-page";

function isAbout(value: unknown): value is AboutPageSettings {
  return Boolean(value && typeof value === "object" && "hero" in value);
}

/**
 * Content migrations are applied in memory on read and persisted by the next
 * admin save; public (ISR) renders must not write or invalidate cache.
 */
export async function readAboutPageSettingsDurable(): Promise<AboutPageSettings> {
  const remote = await readCmsDocumentData(ABOUT_DOC_ID);
  if (isAbout(remote)) {
    replaceAboutPageSettingsCache(remote);
  }
  return getAboutPageSettings();
}

export async function saveAboutPageSettingsDurable(
  settings: AboutPageSettings
): Promise<AboutPageSettings> {
  await readAboutPageSettingsDurable();
  const saved = saveMemory(settings);
  await writeCmsDocumentData(ABOUT_DOC_ID, "website", saved);
  return saved;
}
