import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CMS_DIR = path.join(process.cwd(), "data", "cms");

export function cmsDataPath(filename: string) {
  return path.join(CMS_DIR, filename);
}

export async function readCmsJsonFile<T>(
  filename: string
): Promise<T | null> {
  try {
    const raw = await readFile(cmsDataPath(filename), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeCmsJsonFile(
  filename: string,
  data: unknown
): Promise<void> {
  await mkdir(CMS_DIR, { recursive: true });
  await writeFile(
    cmsDataPath(filename),
    `${JSON.stringify(data, null, 2)}\n`,
    "utf-8"
  );
}
