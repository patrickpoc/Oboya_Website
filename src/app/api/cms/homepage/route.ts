import { NextResponse } from "next/server";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import {
  readHomepageSettingsDurable,
  saveHomepageSettingsDurable,
} from "@/lib/cms/server/homepage.server";
import { revalidateHomePages } from "@/lib/cms/revalidate-site";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import { gateSettingsDocument, stripApprovalMeta } from "@/lib/cms/server/approvals.server";

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
    const body = stripApprovalMeta((await request.json()) as HomepageSettings);
    return await gateSettingsDocument({
      user: auth.user,
      changeType: "website.homepage",
      entityId: "homepage",
      entityLabel: "Home",
      body,
      read: readHomepageSettingsDurable,
      save: saveHomepageSettingsDurable,
      revalidate: revalidateHomePages,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save homepage settings";
    console.error("Homepage save failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
