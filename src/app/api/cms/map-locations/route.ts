import { NextResponse } from "next/server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { CmsReadError, readFailureResponse } from "@/lib/cms/server/strict-read";
import { readMapLocationsStrict } from "@/lib/map-locations.server";
import { noStoreHeaders } from "@/lib/security/http-cache";

export const dynamic = "force-dynamic";

/**
 * Unstripped map data for the admin editor (hidden contacts included).
 * Strict: this is the editor's save baseline, so a failed read must not return seed data.
 */
export async function GET() {
  const auth = await cmsGuard("global_presence", "view");
  if ("response" in auth) return auth.response;

  try {
    return NextResponse.json(await readMapLocationsStrict(), {
      headers: noStoreHeaders,
    });
  } catch (error) {
    if (error instanceof CmsReadError) return readFailureResponse(error);
    console.error("Failed to read map locations:", error);
    return NextResponse.json(
      { error: "Failed to read map locations" },
      { status: 500 }
    );
  }
}
