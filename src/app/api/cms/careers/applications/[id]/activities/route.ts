import { NextResponse } from "next/server";
import { addNote, getApplication, listActivities } from "@/lib/cms/server/careers-applications.server";
import { CareersError, careersErrorResponse } from "@/lib/cms/server/careers-core.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { noStoreHeaders } from "@/lib/security/http-cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  const auth = await cmsGuard("careers", "edit");
  if ("response" in auth) return auth.response;
  try {
    const { id } = await context.params;
    if (!(await getApplication(id))) throw new CareersError(404, "not_found");
    return NextResponse.json({ activities: await listActivities(id) }, { headers: noStoreHeaders });
  } catch (error) {
    return careersErrorResponse(error, "Failed to load activities");
  }
}

/** POST { body } adds a note. */
export async function POST(request: Request, context: Ctx) {
  const auth = await cmsGuard("careers", "edit");
  if ("response" in auth) return auth.response;
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as { body?: string } | null;
    const activity = await addNote(id, String(body?.body ?? ""), { id: auth.user.id, name: auth.user.name });
    return NextResponse.json({ activity }, { status: 201, headers: noStoreHeaders });
  } catch (error) {
    return careersErrorResponse(error, "Failed to add note");
  }
}
