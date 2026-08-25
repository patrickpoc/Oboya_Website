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

let hydrated = false;

async function hydrateFromDisk() {
  if (hydrated) return;
  hydrated = true;
  const fromDisk = await readCmsJsonFile<HomepageSettings>(FILENAME);
  if (fromDisk) {
    replaceHomepageSettingsCache(fromDisk);
  }
}

export async function readHomepageSettingsDurable(): Promise<HomepageSettings> {
  await hydrateFromDisk();
  return getHomepageSettings();
}

export async function saveHomepageSettingsDurable(
  settings: HomepageSettings
): Promise<HomepageSettings> {
  await hydrateFromDisk();
  const saved = saveToMemory(settings);
  try {
    await writeCmsJsonFile(FILENAME, saved);
  } catch {
    // Keep memory if disk is read-only.
  }
  return saved;
}
