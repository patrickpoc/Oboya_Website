import { NextResponse } from "next/server";
import type { HomepageSettings } from "@/lib/cms/repositories/homepage-repository";
import {
  readHomepageSettingsStrict,
  saveHomepageSettingsDurable,
} from "@/lib/cms/server/homepage.server";
import { revalidateHomePages } from "@/lib/cms/revalidate-site";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import {
  gateSettingsDocument,
  stripApprovalMeta,
  withApprovalErrors,
} from "@/lib/cms/server/approvals.server";
import { CmsReadError, readFailureResponse } from "@/lib/cms/server/strict-read";

async function handleGET() {
  const auth = await cmsGuard("website", "view");
  if ("response" in auth) return auth.response;

  const settings = await readHomepageSettingsStrict();
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
      read: readHomepageSettingsStrict,
      save: saveHomepageSettingsDurable,
      revalidate: revalidateHomePages,
    });
  } catch (error) {
    if (error instanceof CmsReadError) return readFailureResponse(error);
    const message =
      error instanceof Error ? error.message : "Failed to save homepage settings";
    console.error("Homepage save failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withApprovalErrors("Failed to load homepage settings", handleGET);
