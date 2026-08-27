import { NextResponse } from "next/server";
import {
  addAuditLogDurable,
  readAuditLogsDurable,
} from "@/lib/cms/server/audit-logs.server";
import type { AuditLogEntry } from "@/lib/cms/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdminUser } from "@/lib/map-locations.server";

async function assertAdmin() {
  if (!isSupabaseConfigured()) return true;
  return Boolean(await requireAdminUser());
}

export async function GET() {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await readAuditLogsDurable());
}

export async function POST(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as Omit<
    AuditLogEntry,
    "id" | "createdAt"
  >;
  const saved = await addAuditLogDurable(body);
  return NextResponse.json(saved, { status: 201 });
}
