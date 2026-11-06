import { NextResponse } from "next/server";
import type { NewsPageSettings } from "@/lib/cms/repositories/news-page-repository";
import {
  readNewsPageSettingsDurable,
  readNewsPageSettingsStrict,
  saveNewsPageSettingsDurable,
} from "@/lib/cms/server/news-page.server";
import { revalidateNewsPages } from "@/lib/cms/revalidate-site";
import { CmsReadError, isEditRead, readFailureResponse } from "@/lib/cms/server/strict-read";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import {
  approvalErrorResponse,
  gateSettingsDocument,
  stripApprovalMeta,
} from "@/lib/cms/server/approvals.server";

export async function GET(request: Request) {
  try {
    if (isEditRead(request)) {
      // Guard first: the strict read uses the session client.
      const auth = await cmsGuard("website", "view");
      if ("response" in auth) return auth.response;
      return NextResponse.json(await readNewsPageSettingsStrict());
    }
    return NextResponse.json(await readNewsPageSettingsDurable());
  } catch (error) {
    if (error instanceof CmsReadError) return readFailureResponse(error);
    console.error("Failed to load news page settings:", error);
    return NextResponse.json({ error: "Failed to load news page settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await cmsGuard("website", "edit");
  if ("response" in auth) return auth.response;
  try {
    const body = stripApprovalMeta((await request.json()) as NewsPageSettings);
    return await gateSettingsDocument({
      user: auth.user,
      changeType: "website.news_page",
      entityId: "news-page",
      entityLabel: "News Page",
      body,
      read: readNewsPageSettingsStrict,
      save: saveNewsPageSettingsDurable,
      revalidate: revalidateNewsPages,
    });
  } catch (error) {
    return approvalErrorResponse(error, "Failed to save news page settings");
  }
}
