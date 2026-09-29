import { NextResponse } from "next/server";
import { readFormSubmissions } from "@/lib/cms/server/forms.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { addAuditLogDurable } from "@/lib/cms/server/audit-logs.server";
import { matchesLeadFilters, submissionsToCsv } from "@/lib/cms/forms/crm";
import type { FormSubmission } from "@/lib/cms/types";
import { noStoreHeaders } from "@/lib/security/http-cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const auth = await cmsGuard("forms", "edit");
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as FormSubmission["type"] | null;
  const maskPii = searchParams.get("mask") === "1";
  const submissions = (await readFormSubmissions(type ?? undefined)).filter((row) =>
    matchesLeadFilters(row, {
      status: searchParams.get("status") ?? undefined,
      assignee: searchParams.get("assignee") ?? undefined,
      tag: searchParams.get("tag") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      q: searchParams.get("q") ?? undefined,
    })
  );
  const csv = submissionsToCsv(submissions, { maskPii });
  try {
    await addAuditLogDurable({
      userId: auth.user.id,
      userName: auth.user.name,
      action: "forms.export",
      module: "forms",
      details: `${submissions.length} rows${maskPii ? " (masked)" : ""}`,
    });
  } catch {
    // Audit is best-effort.
  }
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      ...noStoreHeaders,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${stamp}.csv"`,
    },
  });
}
