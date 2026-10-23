import { NextResponse } from "next/server";
import { getOpening } from "@/lib/cms/server/careers-openings.server";
import { CareersError, careersErrorResponse } from "@/lib/cms/server/careers-core.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { noStoreHeaders } from "@/lib/security/http-cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await cmsGuard("careers", "view");
  if ("response" in auth) return auth.response;
  try {
    const { id } = await context.params;
    const item = await getOpening(id);
    if (!item) throw new CareersError(404, "not_found");
    return NextResponse.json({ item }, { headers: noStoreHeaders });
  } catch (error) {
    return careersErrorResponse(error, "Failed to load opening");
  }
}
