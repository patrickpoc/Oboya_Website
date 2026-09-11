import { NextResponse } from "next/server";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";
import {
  readAboutPageSettingsDurable,
  saveAboutPageSettingsDurable,
} from "@/lib/cms/server/about-page.server";
import { revalidateAboutPages } from "@/lib/cms/revalidate-site";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdminUser } from "@/lib/map-locations.server";

async function assertAdmin() {
  if (!isSupabaseConfigured()) return true;
  return Boolean(await requireAdminUser());
}

export async function GET() {
  return NextResponse.json(await readAboutPageSettingsDurable());
}

export async function PUT(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as AboutPageSettings;
    const saved = await saveAboutPageSettingsDurable(body);
    revalidateAboutPages();
    return NextResponse.json(saved);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save about settings";
    console.error("About save failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
