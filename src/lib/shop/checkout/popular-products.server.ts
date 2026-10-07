import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

const FORMS_FILE = path.join(process.cwd(), "data", "cms", "form-submissions.json");
const TTL_MS = 60 * 60 * 1000;
const ROW_LIMIT = 400;

let cached: { at: number; ids: string[] } | null = null;

function countProductIds(rows: Array<{ data?: unknown; type?: string }>): string[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    if (row.type && row.type !== "quote") continue;
    const data = row.data;
    if (!data || typeof data !== "object") continue;
    const items = (data as { items?: unknown }).items;
    if (!Array.isArray(items)) continue;

    const seen = new Set<string>();
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const productId = (item as { productId?: unknown }).productId;
      if (typeof productId !== "string" || !productId || seen.has(productId)) continue;
      seen.add(productId);
      counts.set(productId, (counts.get(productId) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 24)
    .map(([id]) => id);
}

async function readQuoteRows(): Promise<Array<{ data?: unknown; type?: string }>> {
  if (isSupabaseConfigured() && isServiceRoleConfigured()) {
    const client = createServiceClient();
    const { data, error } = await client
      .from("cms_form_submissions")
      .select("data")
      .eq("type", "quote")
      .order("created_at", { ascending: false })
      .limit(ROW_LIMIT);
    if (error) return [];
    return (data ?? []) as Array<{ data?: unknown }>;
  }

  try {
    const raw = await readFile(FORMS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Array<{ data?: unknown; type?: string }>) : [];
  } catch {
    return [];
  }
}

/** Product ids ranked by how often they appear in recent quotation requests. */
export async function readPopularQuoteProductIds(): Promise<string[]> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.ids;

  let ids: string[] = [];
  try {
    ids = countProductIds(await readQuoteRows());
  } catch {
    ids = [];
  }

  cached = { at: Date.now(), ids };
  return ids;
}
