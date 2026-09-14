import { NextResponse } from "next/server";
import type { NewsPageSettings } from "@/lib/cms/repositories/news-page-repository";
import {
  readNewsPageSettingsDurable,
  saveNewsPageSettingsDurable,
} from "@/lib/cms/server/news-page.server";
import { revalidateNewsPages } from "@/lib/cms/revalidate-site";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";

export async function GET() {
  return NextResponse.json(await readNewsPageSettingsDurable());
}

export async function PUT(request: Request) {
  const auth = await cmsGuard("website", "edit");
  if ("response" in auth) return auth.response;
  const body = (await request.json()) as NewsPageSettings;
  const saved = await saveNewsPageSettingsDurable(body);
  revalidateNewsPages();
  return NextResponse.json(saved);
}
