import { NextResponse } from "next/server";
import type { AboutPageSettings } from "@/lib/cms/repositories/about-page-repository";
import {
  readAboutPageSettingsDurable,
  readAboutPageSettingsStrict,
  saveAboutPageSettingsDurable,
} from "@/lib/cms/server/about-page.server";
import { revalidateAboutPages } from "@/lib/cms/revalidate-site";
import { CmsReadError, isEditRead, readFailureResponse } from "@/lib/cms/server/strict-read";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { gateSettingsDocument, stripApprovalMeta } from "@/lib/cms/server/approvals.server";

export async function GET(request: Request) {
  try {
    if (isEditRead(request)) {
      // Guard first: the strict read uses the session client.
      const auth = await cmsGuard("website", "view");
      if ("response" in auth) return auth.response;
      return NextResponse.json(await readAboutPageSettingsStrict());
    }
    return NextResponse.json(await readAboutPageSettingsDurable());
  } catch (error) {
    if (error instanceof CmsReadError) return readFailureResponse(error);
    console.error("Failed to load about settings:", error);
    return NextResponse.json({ error: "Failed to load about settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await cmsGuard("website", "edit");
  if ("response" in auth) return auth.response;

  try {
    const body = stripApprovalMeta((await request.json()) as AboutPageSettings);
    return await gateSettingsDocument({
      user: auth.user,
      changeType: "website.about",
      entityId: "about",
      entityLabel: "About Us",
      body,
      read: readAboutPageSettingsStrict,
      save: saveAboutPageSettingsDurable,
      revalidate: revalidateAboutPages,
    });
  } catch (error) {
    if (error instanceof CmsReadError) return readFailureResponse(error);
    const message =
      error instanceof Error ? error.message : "Failed to save about settings";
    console.error("About save failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
