import "server-only";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  getHomepageSettings,
  replaceHomepageSettingsCache,
  saveHomepageSettings,
  type HomepageSettings,
} from "@/lib/cms/repositories/homepage-repository";

const HOMEPAGE_FILE = path.join(
  process.cwd(),
  "data",
  "cms",
  "homepage-settings.json"
);

let hydrated = false;

async function hydrateFromDisk() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await readFile(HOMEPAGE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as HomepageSettings;
    if (parsed && typeof parsed === "object" && parsed.hero) {
      replaceHomepageSettingsCache(parsed);
    }
  } catch {
    // Keep module seed when file is missing.
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
  const saved = saveHomepageSettings(settings);
  try {
    await writeFile(HOMEPAGE_FILE, `${JSON.stringify(saved, null, 2)}\n`, "utf-8");
  } catch {
    // Keep in-memory even if disk write fails.
  }
  return saved;
}
