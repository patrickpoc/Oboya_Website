import "server-only";

import {
  getSolutionsPageSettings,
  normalizeSolutionsPageSettings,
  replaceSolutionsPageSettingsCache,
  saveSolutionsPageSettings as saveMemory,
  type SolutionsPageSettings,
} from "@/lib/cms/repositories/solutions-page-repository";
import {
  readCmsDocumentData,
  writeCmsDocumentData,
} from "@/lib/cms/server/cms-document.server";
import { readCmsDocumentChecked } from "@/lib/cms/server/strict-read";

export const SOLUTIONS_DOC_ID = "solutions-page";

function isSolutions(value: unknown): value is SolutionsPageSettings {
  return Boolean(value && typeof value === "object" && "hero" in value && "banners" in value);
}

export async function readSolutionsPageSettingsDurable(): Promise<SolutionsPageSettings> {
  const remote = await readCmsDocumentData(SOLUTIONS_DOC_ID);
  if (isSolutions(remote)) {
    replaceSolutionsPageSettingsCache(remote);
    return getSolutionsPageSettings();
  }
  return getSolutionsPageSettings();
}

/** Save baseline: throws on a failed read; the cache changes only on success. */
export async function readSolutionsPageSettingsStrict(): Promise<SolutionsPageSettings> {
  const remote = await readCmsDocumentChecked(SOLUTIONS_DOC_ID, isSolutions);
  if (remote) replaceSolutionsPageSettingsCache(remote);
  return getSolutionsPageSettings();
}

export async function saveSolutionsPageSettingsDurable(
  settings: SolutionsPageSettings
): Promise<SolutionsPageSettings> {
  await readSolutionsPageSettingsStrict();
  const saved = saveMemory(normalizeSolutionsPageSettings(settings));
  await writeCmsDocumentData(SOLUTIONS_DOC_ID, "website", saved);
  return saved;
}
