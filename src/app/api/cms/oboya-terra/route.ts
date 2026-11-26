import { NextResponse } from "next/server";
import { normalizeOboyaTerraSettings } from "@/lib/cms/repositories/oboya-terra-repository";
import {
  readOboyaTerraSettingsDurable,
  readOboyaTerraSettingsStrict,
  saveOboyaTerraSettingsDurable,
} from "@/lib/cms/server/oboya-terra.server";
import { revalidateOboyaTerraPages } from "@/lib/cms/revalidate-site";
import { CmsReadError, isEditRead, readFailureResponse } from "@/lib/cms/server/strict-read";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import {
  approvalErrorResponse,
  gateSettingsDocument,
} from "@/lib/cms/server/approvals.server";

export async function GET(request: Request) {
  try {
    if (isEditRead(request)) {
      // Guard first: the strict read uses the session client.
      const auth = await cmsGuard("website", "view");
      if ("response" in auth) return auth.response;
      return NextResponse.json(await readOboyaTerraSettingsStrict());
    }
    return NextResponse.json(await readOboyaTerraSettingsDurable());
  } catch (error) {
    if (error instanceof CmsReadError) return readFailureResponse(error);
    console.error("Failed to load Oboya Terra settings:", error);
    return NextResponse.json({ error: "Failed to load Oboya Terra settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await cmsGuard("website", "edit");
  if ("response" in auth) return auth.response;
  try {
    const input: unknown = await request.json();
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    // Normalize before the approval gate so approvers see what will be saved.
    const body = normalizeOboyaTerraSettings(input);
    return await gateSettingsDocument({
      user: auth.user,
      changeType: "website.oboya_terra",
      entityId: "oboya-terra-page",
      entityLabel: "Oboya Terra Page",
      body,
      read: readOboyaTerraSettingsStrict,
      save: saveOboyaTerraSettingsDurable,
      revalidate: revalidateOboyaTerraPages,
    });
  } catch (error) {
    return approvalErrorResponse(error, "Failed to save Oboya Terra settings");
  }
}
