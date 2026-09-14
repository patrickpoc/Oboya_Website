import { NextResponse } from "next/server";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import {
  readHomepageSettingsDurable,
  saveHomepageSettingsDurable,
} from "@/lib/cms/server/homepage.server";
import { revalidateHomePages } from "@/lib/cms/revalidate-site";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";

export async function GET() {
  const auth = await cmsGuard("website", "view");
  if ("response" in auth) return auth.response;

  const settings = await readHomepageSettingsDurable();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const auth = await cmsGuard("website", "edit");
  if ("response" in auth) return auth.response;

  try {
    const body = (await request.json()) as HomepageSettings;
    const saved = await saveHomepageSettingsDurable(body);
    revalidateHomePages();
    return NextResponse.json(saved);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save homepage settings";
    console.error("Homepage save failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
