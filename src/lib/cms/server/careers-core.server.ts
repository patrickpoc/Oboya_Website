import "server-only";

import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { ApprovalError, approvalErrorResponse } from "@/lib/cms/server/approvals.server";
import { noStoreHeaders } from "@/lib/security/http-cache";
import { writeLocalJsonFile } from "@/lib/cms/server/local-fs.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServiceClient, isServiceRoleConfigured } from "@/lib/supabase/admin";

/** Error with an HTTP status and a stable, PII-free code. */
export class CareersError extends Error {
  constructor(
    public status: 400 | 404 | 409 | 503,
    public code: string
  ) {
    super(code);
  }
}

/** Service-role client on hosted; null = local JSON fallback. Throws 503 when the key is missing. */
export function careersClient() {
  if (!isSupabaseConfigured()) return null;
  if (!isServiceRoleConfigured()) throw new CareersError(503, "service_unavailable");
  return createServiceClient();
}

export async function readLocalJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(file, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

export const writeLocalJson = writeLocalJsonFile;

/** Maps domain/approval errors to JSON responses. Never logs row data, only the error message. */
export function careersErrorResponse(error: unknown, fallback: string) {
  if (error instanceof CareersError) {
    return NextResponse.json({ error: error.code }, { status: error.status, headers: noStoreHeaders });
  }
  if (error instanceof ApprovalError) return approvalErrorResponse(error, fallback);
  console.error(fallback, error instanceof Error ? error.message : "unknown");
  return NextResponse.json({ error: fallback }, { status: 500, headers: noStoreHeaders });
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PgError = { code?: string; message?: string } | null;

export function throwIfDbError(error: PgError) {
  if (error) throw new Error(error.code ?? "db_error");
}

/** Drops undefined/empty so optional columns become null. */
export const orNull = <T,>(value: T | undefined | "") => (value === undefined || value === "" ? null : value);
