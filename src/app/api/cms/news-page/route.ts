import { NextResponse } from "next/server";
import type { NewsPageSettings } from "@/lib/cms/repositories/news-page-repository";
import {
  readNewsPageSettingsDurable,
  saveNewsPageSettingsDurable,
} from "@/lib/cms/server/news-page.server";
import { revalidateNewsPages } from "@/lib/cms/revalidate-site";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import {
  approvalErrorResponse,
  gateSettingsDocument,
  stripApprovalMeta,
} from "@/lib/cms/server/approvals.server";

export async function GET() {
  return NextResponse.json(await readNewsPageSettingsDurable());
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
      read: readNewsPageSettingsDurable,
      save: saveNewsPageSettingsDurable,
      revalidate: revalidateNewsPages,
    });
  } catch (error) {
    return approvalErrorResponse(error, "Failed to save news page settings");
  }
}
