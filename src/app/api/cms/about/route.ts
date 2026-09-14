import { NextResponse } from "next/server";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";
import {
  readAboutPageSettingsDurable,
  saveAboutPageSettingsDurable,
} from "@/lib/cms/server/about-page.server";
import { revalidateAboutPages } from "@/lib/cms/revalidate-site";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";

export async function GET() {
  try {
    return NextResponse.json(await readAboutPageSettingsDurable());
  } catch (error) {
    console.error("Failed to load about settings:", error);
    return NextResponse.json({ error: "Failed to load about settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await cmsGuard("website", "edit");
  if ("response" in auth) return auth.response;

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
