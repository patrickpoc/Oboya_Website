import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { writeLocalJsonFile } from "@/lib/cms/server/local-fs.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient, createPublicClient } from "@/lib/supabase/server";

const DATA_DIR = path.join(process.cwd(), "data", "cms");

export async function readCmsDocumentData(
  docId: string
): Promise<unknown | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from("cms_documents")
        .select("data")
        .eq("id", docId)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (data?.data != null) return data.data;
    } catch (error) {
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
    return;
  }

  await writeLocalJsonFile(path.join(DATA_DIR, `${docId}.json`), data);
}
