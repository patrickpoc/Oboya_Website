import { NextResponse } from "next/server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { readMapLocations } from "@/lib/map-locations.server";
import { noStoreHeaders } from "@/lib/security/http-cache";

export const dynamic = "force-dynamic";

/** Unstripped map data for the admin editor (hidden contacts included). */
export async function GET() {
  const auth = await cmsGuard("global_presence", "view");
  if ("response" in auth) return auth.response;

  try {
    return NextResponse.json(await readMapLocations(), {
      headers: noStoreHeaders,
    });
  } catch (error) {
    console.error("Failed to read map locations:", error);
    return NextResponse.json(
      { error: "Failed to read map locations" },
      { status: 500 }
    );
  }
}
