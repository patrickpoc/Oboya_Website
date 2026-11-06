import { NextResponse } from "next/server";
import type { SolutionsPageSettings } from "@/lib/cms/repositories/solutions-page-repository";
import {
  readSolutionsPageSettingsDurable,
  readSolutionsPageSettingsStrict,
  saveSolutionsPageSettingsDurable,
} from "@/lib/cms/server/solutions-page.server";
import { CmsReadError, isEditRead, readFailureResponse } from "@/lib/cms/server/strict-read";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { revalidateSolutionsPages } from "@/lib/cms/revalidate-site";
import { gateSettingsDocument, stripApprovalMeta } from "@/lib/cms/server/approvals.server";

export async function GET(request: Request) {
  try {
    if (isEditRead(request)) {
      // Guard first: the strict read uses the session client.
      const auth = await cmsGuard("website", "view");
      if ("response" in auth) return auth.response;
      return NextResponse.json(await readSolutionsPageSettingsStrict());
    }
    return NextResponse.json(await readSolutionsPageSettingsDurable());
  } catch (error) {
    if (error instanceof CmsReadError) return readFailureResponse(error);
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
      read: readSolutionsPageSettingsStrict,
      save: saveSolutionsPageSettingsDurable,
      revalidate: revalidateSolutionsPages,
    });
  } catch (error) {
    if (error instanceof CmsReadError) return readFailureResponse(error);
    const message =
      error instanceof Error ? error.message : "Failed to save solutions settings";
    console.error("Solutions save failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
