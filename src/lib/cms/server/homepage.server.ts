import "server-only";

import {
  getHomepageSettings,
  replaceHomepageSettingsCache,
  saveHomepageSettings as saveToMemory,
  type HomepageSettings,
} from "@/lib/cms/repositories/homepage-repository";
import {
  readCmsJsonFile,
  writeCmsJsonFile,
} from "@/lib/cms/server/cms-file.server";

const FILENAME = "homepage-settings.json";

/**
 * Always prefer disk so API route handlers and RSC share the same source of
 * truth (module-level memory is not shared across Next.js bundles).
 */
export async function readHomepageSettingsDurable(): Promise<HomepageSettings> {
  const fromDisk = await readCmsJsonFile<HomepageSettings>(FILENAME);
  if (fromDisk) {
    return replaceHomepageSettingsCache(fromDisk);
  }
  return getHomepageSettings();
}

export async function saveHomepageSettingsDurable(
  settings: HomepageSettings
): Promise<HomepageSettings> {
  const saved = saveToMemory(settings);
  try {
    await writeCmsJsonFile(FILENAME, saved);
  } catch {
    // Keep memory if disk is read-only.
  }
  return saved;
}
