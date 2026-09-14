import {
  validateMapLocations,
  type MapLocationsData,
} from "@/lib/map-locations";
import {
  readMapLocations,
  writeMapLocations,
} from "@/lib/map-locations.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { revalidateMapPages } from "@/lib/cms/revalidate-site";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await readMapLocations();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to read map locations:", error);
    return NextResponse.json(
      { error: "Failed to read map locations" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const auth = await cmsGuard("global_presence", "edit");
  if ("response" in auth) return auth.response;

  try {
    const body = (await request.json()) as MapLocationsData;
    const errors = validateMapLocations(body);

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    await writeMapLocations(body);
    revalidateMapPages();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to write map locations:", error);
    return NextResponse.json(
      { error: "Failed to write map locations" },
      { status: 500 }
    );
  }
}
