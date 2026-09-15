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

export async function saveSolutionsPageSettingsDurable(
  settings: SolutionsPageSettings
): Promise<SolutionsPageSettings> {
  await readSolutionsPageSettingsDurable();
  const saved = saveMemory(normalizeSolutionsPageSettings(settings));
  await writeCmsDocumentData(SOLUTIONS_DOC_ID, "website", saved);
  return saved;
}
