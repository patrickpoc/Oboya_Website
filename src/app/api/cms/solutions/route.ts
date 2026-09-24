import { NextResponse } from "next/server";
import type { SolutionsPageSettings } from "@/lib/cms/repositories/solutions-page-repository";
import {
  readSolutionsPageSettingsDurable,
  saveSolutionsPageSettingsDurable,
} from "@/lib/cms/server/solutions-page.server";
import { locales } from "@/i18n/routing";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    return NextResponse.json(await readSolutionsPageSettingsDurable());
  } catch (error) {
    console.error("Failed to load solutions settings:", error);
    return NextResponse.json(
      { error: "Failed to load solutions settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const auth = await cmsGuard("website", "edit");
  if ("response" in auth) return auth.response;

  try {
    const body = (await request.json()) as SolutionsPageSettings;
    const saved = await saveSolutionsPageSettingsDurable(body);
    try {
      for (const locale of locales) {
        revalidatePath(`/${locale}/solutions`);
      }
    } catch {
      // Ignore when revalidation is unavailable.
    }
    return NextResponse.json(saved);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save solutions settings";
    console.error("Solutions save failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
