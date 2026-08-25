import { NextResponse } from "next/server";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import { unauthorizedIfNeeded } from "@/lib/cms/server/cms-auth.server";
import { revalidatePublicSite } from "@/lib/cms/server/cms-revalidate.server";
import {
  readHomepageSettingsDurable,
  saveHomepageSettingsDurable,
} from "@/lib/cms/server/homepage.server";

export async function GET() {
  const settings = await readHomepageSettingsDurable();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const denied = await unauthorizedIfNeeded();
  if (denied) return denied;

  try {
    const body = (await request.json()) as HomepageSettings;
    const saved = await saveHomepageSettingsDurable(body);
    revalidatePublicSite();
    return NextResponse.json(saved);
  } catch (error) {
    console.error("Failed to save homepage settings:", error);
    return NextResponse.json(
      { error: "Failed to save homepage settings" },
      { status: 500 }
    );
  }
}
