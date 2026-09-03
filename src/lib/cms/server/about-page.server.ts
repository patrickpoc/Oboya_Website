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

export async function readAboutPageSettingsDurable(): Promise<AboutPageSettings> {
  const remote = await readCmsDocumentData(ABOUT_DOC_ID);
  if (isAbout(remote)) {
    const beforeYears = (remote.timeline?.events ?? [])
      .map((event) => event.year)
      .join(",");
    const beforeCallout = remote.callout?.body?.en ?? "";
    const beforeHero = remote.hero?.title?.en ?? "";
    replaceAboutPageSettingsCache(remote);
    const normalized = getAboutPageSettings();
    const afterYears = (normalized.timeline?.events ?? [])
      .map((event) => event.year)
      .join(",");
    const afterCallout = normalized.callout?.body?.en ?? "";
    const afterHero = normalized.hero?.title?.en ?? "";

    // Persist one-time content migrations so live CMS stays in sync.
    if (
      beforeYears !== afterYears ||
      beforeCallout !== afterCallout ||
      beforeHero !== afterHero
    ) {
      await writeCmsDocumentData(ABOUT_DOC_ID, "website", normalized);
    }

    return normalized;
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
