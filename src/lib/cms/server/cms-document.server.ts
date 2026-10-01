import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { docTag } from "@/lib/cms/cache-tags";
import { invalidateDocument } from "@/lib/cms/server/cache-invalidation.server";
import { writeLocalJsonFile } from "@/lib/cms/server/local-fs.server";
import { rethrowNextSignals } from "@/lib/cms/server/rethrow-next-signals";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient, createPublicClient } from "@/lib/supabase/server";

const DATA_DIR = path.join(process.cwd(), "data", "cms");

export async function readCmsDocumentData(
  docId: string,
  options?: { fresh?: boolean }
): Promise<unknown | null> {
  if (isSupabaseConfigured()) {
    try {
      // Admin/save paths must not hit the public Data Cache or they
      // read-modify-write stale translations back to Supabase.
      const supabase = options?.fresh
        ? await createClient()
        : createPublicClient({ tags: [docTag(docId)] });
      const { data, error } = await supabase
        .from("cms_documents")
        .select("data")
        .eq("id", docId)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (data?.data != null) return data.data;
    } catch (error) {
      rethrowNextSignals(error);
      console.error(
        `cms_documents read (${docId}):`,
        error instanceof Error ? error.message : error
      );
    }
  }

  try {
    const raw = await readFile(path.join(DATA_DIR, `${docId}.json`), "utf-8");
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export async function writeCmsDocumentData(
  docId: string,
  module: string,
  data: unknown
): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.from("cms_documents").upsert({
      id: docId,
      module,
      data,
      status: "published",
      updated_at: new Date().toISOString(),
    });
    if (error) {
      throw new Error(error.message || `Failed to save ${docId}`);
    }
    invalidateDocument(docId);
    return;
  }

  await writeLocalJsonFile(path.join(DATA_DIR, `${docId}.json`), data);
}
