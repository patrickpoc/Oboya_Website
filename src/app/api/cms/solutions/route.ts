import { NextResponse } from "next/server";
import type { SolutionsPageSettings } from "@/lib/cms/repositories/solutions-page-repository";
import {
  readSolutionsPageSettingsDurable,
  saveSolutionsPageSettingsDurable,
} from "@/lib/cms/server/solutions-page.server";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { revalidateSolutionsPages } from "@/lib/cms/revalidate-site";
import { gateSettingsDocument, stripApprovalMeta } from "@/lib/cms/server/approvals.server";

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
    const body = stripApprovalMeta((await request.json()) as SolutionsPageSettings);
    return await gateSettingsDocument({
      user: auth.user,
      changeType: "website.solutions",
      entityId: "solutions",
      entityLabel: "Solutions",
      body,
      read: readSolutionsPageSettingsDurable,
      save: saveSolutionsPageSettingsDurable,
      revalidate: revalidateSolutionsPages,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save solutions settings";
    console.error("Solutions save failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
