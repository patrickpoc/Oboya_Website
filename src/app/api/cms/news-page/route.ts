import { NextResponse } from "next/server";
import type { NewsPageSettings } from "@/lib/cms/repositories/news-page-repository";
import {
  readNewsPageSettingsDurable,
  saveNewsPageSettingsDurable,
} from "@/lib/cms/server/news-page.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdminUser } from "@/lib/map-locations.server";

async function assertAdmin() {
  if (!isSupabaseConfigured()) return true;
  return Boolean(await requireAdminUser());
}

export async function GET() {
  return NextResponse.json(await readNewsPageSettingsDurable());
}

export async function PUT(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as NewsPageSettings;
  const saved = await saveNewsPageSettingsDurable(body);
  return NextResponse.json(saved);
}
