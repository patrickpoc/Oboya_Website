import { locales } from "@/i18n/routing";
import {
  validateMapLocations,
  type MapLocationsData,
} from "@/lib/map-locations";
import {
  readMapLocations,
  requireAdminUser,
  writeMapLocations,
} from "@/lib/map-locations.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { revalidatePath } from "next/cache";
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
  if (isSupabaseConfigured()) {
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = (await request.json()) as MapLocationsData;
    const errors = validateMapLocations(body);

    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    await writeMapLocations(body);

    for (const locale of locales) {
      revalidatePath(`/${locale}`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to write map locations:", error);
    return NextResponse.json(
      { error: "Failed to write map locations" },
      { status: 500 }
    );
  }
}
