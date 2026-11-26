import "server-only";

import {
  getOboyaTerraSettings,
  replaceOboyaTerraSettingsCache,
  saveOboyaTerraSettings as saveMemory,
  type OboyaTerraSettings,
} from "@/lib/cms/repositories/oboya-terra-repository";
import {
  readCmsDocumentData,
  writeCmsDocumentData,
} from "@/lib/cms/server/cms-document.server";
import { readCmsDocumentChecked } from "@/lib/cms/server/strict-read";

export const OBOYA_TERRA_DOC_ID = "oboya-terra-page";

function isTerra(value: unknown): value is OboyaTerraSettings {
  return Boolean(value && typeof value === "object" && "blocks" in value);
}

export async function readOboyaTerraSettingsDurable(): Promise<OboyaTerraSettings> {
  const remote = await readCmsDocumentData(OBOYA_TERRA_DOC_ID);
  if (isTerra(remote)) replaceOboyaTerraSettingsCache(remote);
  return getOboyaTerraSettings();
}

/** Save baseline: throws on a failed read; the cache changes only on success. */
export async function readOboyaTerraSettingsStrict(): Promise<OboyaTerraSettings> {
  const remote = await readCmsDocumentChecked(OBOYA_TERRA_DOC_ID, isTerra);
  if (remote) replaceOboyaTerraSettingsCache(remote);
  return getOboyaTerraSettings();
}

export async function saveOboyaTerraSettingsDurable(
  settings: OboyaTerraSettings
): Promise<OboyaTerraSettings> {
  await readOboyaTerraSettingsStrict();
  const saved = saveMemory(settings);
  await writeCmsDocumentData(OBOYA_TERRA_DOC_ID, "website", saved);
  return saved;
}
