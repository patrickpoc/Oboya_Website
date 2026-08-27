import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Local JSON writes are only for non-Supabase/dev hosts.
 * Vercel (and any host with Supabase configured) must never write under process.cwd().
 */
export function assertLocalDiskWritable() {
  if (isSupabaseConfigured()) {
    throw new Error(
      "Local disk writes are disabled when Supabase is configured. Persist via Supabase instead."
    );
  }
}

export async function writeLocalJsonFile(
  filePath: string,
  data: unknown
): Promise<void> {
  assertLocalDiskWritable();
  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
  } catch (error) {
    if (
      error instanceof Error &&
      /EROFS|read-only file system|EACCES/i.test(error.message)
    ) {
      throw new Error(
        `Cannot write ${path.basename(filePath)} on a read-only filesystem. Configure Supabase for durable saves.`
      );
    }
    throw error;
  }
}
