import { NextResponse } from "next/server";
import {
  anonymizeApplication,
  deleteApplication,
  getApplication,
  markApplicationRead,
  patchApplication,
} from "@/lib/cms/server/careers-applications.server";
import { CareersError, careersErrorResponse } from "@/lib/cms/server/careers-core.server";
import { addAuditLogDurable } from "@/lib/cms/server/audit-logs.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { noStoreHeaders } from "@/lib/security/http-cache";
import type { CmsUser } from "@/lib/cms/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Ctx = { params: Promise<{ id: string }> };

/** Best-effort audit entry; ids only, no candidate data. */
async function audit(user: CmsUser, action: string, id: string) {
  try {
    await addAuditLogDurable({ userId: user.id, userName: user.name, action, module: "careers", resourceId: id });
  } catch {
    // Audit is best-effort.
  }
}

export async function GET(_request: Request, context: Ctx) {
  const auth = await cmsGuard("careers", "edit");
  if ("response" in auth) return auth.response;
  try {
    const item = await getApplication((await context.params).id);
    if (!item) throw new CareersError(404, "not_found");
    return NextResponse.json({ item }, { headers: noStoreHeaders });
  } catch (error) {
    return careersErrorResponse(error, "Failed to load application");
  }
}

export async function PATCH(request: Request, context: Ctx) {
  const auth = await cmsGuard("careers", "edit");
  if ("response" in auth) return auth.response;
  try {
    const body = await request.json().catch(() => null);
    if ((body as { markRead?: unknown } | null)?.markRead === true) {
      const marked = await markApplicationRead((await context.params).id);
      return NextResponse.json({ item: marked }, { headers: noStoreHeaders });
    }
    const item = await patchApplication((await context.params).id, body, {
      id: auth.user.id,
      name: auth.user.name,
    });
    return NextResponse.json({ item }, { headers: noStoreHeaders });
  } catch (error) {
    return careersErrorResponse(error, "Failed to update application");
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  const auth = await cmsGuard("careers", "delete");
  if ("response" in auth) return auth.response;
  try {
    const { id } = await context.params;
    await deleteApplication(id);
    await audit(auth.user, "careers.application.delete", id);
    return NextResponse.json({ ok: true }, { headers: noStoreHeaders });
  } catch (error) {
    return careersErrorResponse(error, "Failed to delete application");
  }
}

/** POST { action: "anonymize" } — erasure keeps the row for statistics. */
export async function POST(request: Request, context: Ctx) {
  const auth = await cmsGuard("careers", "delete");
  if ("response" in auth) return auth.response;
  try {
    const body = (await request.json().catch(() => null)) as { action?: string } | null;
    if (body?.action !== "anonymize") throw new CareersError(400, "invalidAction");
    const { id } = await context.params;
    const item = await anonymizeApplication(id, { id: auth.user.id, name: auth.user.name });
    await audit(auth.user, "careers.application.anonymize", id);
    return NextResponse.json({ item }, { headers: noStoreHeaders });
  } catch (error) {
    return careersErrorResponse(error, "Failed to anonymize application");
  }
}
