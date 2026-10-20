import { NextResponse } from "next/server";
import { toAdminApplication } from "@/lib/cms/careers/admin-view";
import {
  applicationFiltersFromQuery,
  createApplication,
  listApplications,
} from "@/lib/cms/server/careers-applications.server";
import { careersErrorResponse } from "@/lib/cms/server/careers-core.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { noStoreHeaders } from "@/lib/security/http-cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const auth = await cmsGuard("careers", "edit");
  if ("response" in auth) return auth.response;
  try {
    const items = await listApplications(applicationFiltersFromQuery(new URL(request.url).searchParams));
    return NextResponse.json({ items: items.map(toAdminApplication) }, { headers: noStoreHeaders });
  } catch (error) {
    return careersErrorResponse(error, "Failed to load applications");
  }
}

export async function POST(request: Request) {
  const auth = await cmsGuard("careers", "edit");
  if ("response" in auth) return auth.response;
  try {
    const body = await request.json().catch(() => null);
    const item = await createApplication(body, { id: auth.user.id, name: auth.user.name });
    return NextResponse.json({ item: toAdminApplication(item) }, { status: 201, headers: noStoreHeaders });
  } catch (error) {
    return careersErrorResponse(error, "Failed to create application");
  }
}
