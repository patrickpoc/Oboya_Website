import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import {
  readHomepageSettingsDurable,
  saveHomepageSettingsDurable,
} from "@/lib/cms/server/homepage.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdminUser } from "@/lib/map-locations.server";

export async function GET() {
  if (isSupabaseConfigured()) {
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const settings = await readHomepageSettingsDurable();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  if (isSupabaseConfigured()) {
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = (await request.json()) as HomepageSettings;
    const saved = await saveHomepageSettingsDurable(body);
    revalidatePath("/", "layout");
    for (const locale of ["en", "pt-BR", "es", "zh-CN"]) {
      revalidatePath(`/${locale}`);
    }
    return NextResponse.json(saved);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save homepage settings";
    console.error("Homepage save failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
