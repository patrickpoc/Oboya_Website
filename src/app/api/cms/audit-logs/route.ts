import { NextResponse } from "next/server";
import {
  addAuditLogDurable,
  readAuditLogsDurable,
} from "@/lib/cms/server/audit-logs.server";
import type { AuditLogEntry } from "@/lib/cms/types";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";

export async function GET() {
  const auth = await cmsGuard("audit_logs", "view");
  if ("response" in auth) return auth.response;
  return NextResponse.json(await readAuditLogsDurable());
}

export async function POST(request: Request) {
  const auth = await cmsGuard("audit_logs", "create");
  if ("response" in auth) return auth.response;
  const body = (await request.json()) as Omit<
    AuditLogEntry,
    "id" | "createdAt"
  >;
  const saved = await addAuditLogDurable(body);
  return NextResponse.json(saved, { status: 201 });
}
