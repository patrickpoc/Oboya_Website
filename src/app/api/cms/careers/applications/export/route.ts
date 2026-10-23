import { NextResponse } from "next/server";
import { applicationsToCsv } from "@/lib/cms/careers/filters";
import {
  applicationFiltersFromQuery,
  listApplications,
} from "@/lib/cms/server/careers-applications.server";
import { listOpenings } from "@/lib/cms/server/careers-openings.server";
import { careersErrorResponse } from "@/lib/cms/server/careers-core.server";
import { addAuditLogDurable } from "@/lib/cms/server/audit-logs.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { noStoreHeaders } from "@/lib/security/http-cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const auth = await cmsGuard("careers", "edit");
  if ("response" in auth) return auth.response;
  try {
    const rows = await listApplications(applicationFiltersFromQuery(new URL(request.url).searchParams));
    const openings = await listOpenings({ status: "all" });
    const csv = applicationsToCsv(
      rows,
      Object.fromEntries(openings.map((o) => [o.id, o.title.en || o.slug]))
    );
    try {
      await addAuditLogDurable({
        userId: auth.user.id,
        userName: auth.user.name,
        action: "careers.export",
        module: "careers",
        details: `${rows.length} rows`,
      });
    } catch {
      // Audit is best-effort.
    }
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(csv, {
      headers: {
        ...noStoreHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="applications-${stamp}.csv"`,
      },
    });
  } catch (error) {
    return careersErrorResponse(error, "Failed to export applications");
  }
}
