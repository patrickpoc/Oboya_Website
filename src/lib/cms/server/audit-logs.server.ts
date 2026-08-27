import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AuditLogEntry } from "@/lib/cms/types";
import {
  addAuditLog as addMemory,
  getAuditLogs,
  replaceAuditLogsCache,
} from "@/lib/cms/repositories/users-repository";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import {
  createServiceClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/admin";

const AUDIT_FILE = path.join(process.cwd(), "data", "cms", "audit-logs.json");

type AuditRow = {
  id: string;
  user_id: string | null;
  user_name: string;
  action: string;
  module: string;
  resource_id: string | null;
  details: string | null;
  created_at: string;
};

function rowToEntry(row: AuditRow): AuditLogEntry {
  return {
    id: row.id,
    userId: row.user_id ?? "",
    userName: row.user_name,
    action: row.action,
    module: row.module as AuditLogEntry["module"],
    resourceId: row.resource_id ?? undefined,
    details: row.details ?? undefined,
    createdAt: row.created_at,
  };
}

export async function readAuditLogsDurable(): Promise<AuditLogEntry[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("cms_audit_logs")
        .select(
          "id, user_id, user_name, action, module, resource_id, details, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw new Error(error.message);
      if (data) {
        const entries = (data as AuditRow[]).map(rowToEntry);
        replaceAuditLogsCache(entries);
        return entries;
      }
    } catch (error) {
      console.error(
        "cms_audit_logs read failed:",
        error instanceof Error ? error.message : error
      );
    }
  }

  try {
    const raw = await readFile(AUDIT_FILE, "utf-8");
    const parsed = JSON.parse(raw) as AuditLogEntry[];
    if (Array.isArray(parsed)) {
      replaceAuditLogsCache(parsed);
    }
  } catch {
    /* seed cache */
  }

  return getAuditLogs();
}

export async function addAuditLogDurable(
  entry: Omit<AuditLogEntry, "id" | "createdAt">
): Promise<AuditLogEntry> {
  if (isSupabaseConfigured()) {
    try {
      const client = isServiceRoleConfigured()
        ? createServiceClient()
        : await createClient();
      const { data, error } = await client
        .from("cms_audit_logs")
        .insert({
          user_id: entry.userId || null,
          user_name: entry.userName,
          action: entry.action,
          module: entry.module,
          resource_id: entry.resourceId ?? null,
          details: entry.details ?? null,
        })
        .select(
          "id, user_id, user_name, action, module, resource_id, details, created_at"
        )
        .single();

      if (error) throw new Error(error.message);
      const log = rowToEntry(data as AuditRow);
      const current = getAuditLogs();
      replaceAuditLogsCache([log, ...current.filter((e) => e.id !== log.id)]);
      return log;
    } catch (error) {
      console.error(
        "cms_audit_logs insert failed:",
        error instanceof Error ? error.message : error
      );
    }
  }

  const log = addMemory(entry);
  try {
    await mkdir(path.dirname(AUDIT_FILE), { recursive: true });
    await writeFile(
      AUDIT_FILE,
      `${JSON.stringify(getAuditLogs(), null, 2)}\n`,
      "utf-8"
    );
  } catch {
    /* keep memory */
  }
  return log;
}
