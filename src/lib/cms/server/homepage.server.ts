import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  getHomepageSettings,
  replaceHomepageSettingsCache,
  saveHomepageSettings,
  type HomepageSettings,
} from "@/lib/cms/repositories/homepage-repository";
import { writeLocalJsonFile } from "@/lib/cms/server/local-fs.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient, createPublicClient } from "@/lib/supabase/server";

const HOMEPAGE_FILE = path.join(
  process.cwd(),
  "data",
  "cms",
  "homepage-settings.json"
);

export const HOMEPAGE_DOC_ID = "homepage";

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

async function readHomepageFromSupabase(): Promise<HomepageSettings | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("cms_documents")
    .select("data")
    .eq("id", HOMEPAGE_DOC_ID)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const doc = data?.data;
  if (!doc || typeof doc !== "object" || !("hero" in doc)) {
    return null;
  }

  return doc as HomepageSettings;
}

async function writeHomepageToSupabase(settings: HomepageSettings) {
  const supabase = await createClient();
  const { error } = await supabase.from("cms_documents").upsert({
    id: HOMEPAGE_DOC_ID,
    module: "homepage",
    data: settings,
    status: "published",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message || "Failed to save homepage to Supabase");
  }
}

export async function readHomepageSettingsDurable(): Promise<HomepageSettings> {
  if (isSupabaseConfigured()) {
    try {
      const remote = await readHomepageFromSupabase();
      if (remote) {
        replaceHomepageSettingsCache(remote);
        hydrated = true;
        return getHomepageSettings();
      }
    } catch (error) {
      console.error(
        "Supabase homepage read failed; falling back to local:",
        error instanceof Error ? error.message : error
      );
    }
  }

  await hydrateFromDisk();
  return getHomepageSettings();
}

export async function saveHomepageSettingsDurable(
  settings: HomepageSettings
): Promise<HomepageSettings> {
  await hydrateFromDisk();
  const saved = saveHomepageSettings(settings);

  if (isSupabaseConfigured()) {
    await writeHomepageToSupabase(saved);
    return saved;
  }

  await writeLocalJsonFile(HOMEPAGE_FILE, saved);
  return saved;
}
