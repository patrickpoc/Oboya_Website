import { NextResponse } from "next/server";
import type { BlogCategory } from "@/lib/cms/repositories/blog-categories-repository";
import {
  deleteBlogCategoryDurable,
  readBlogCategoriesDurable,
  saveBlogCategoryDurable,
} from "@/lib/cms/server/blog-categories.server";
import { revalidateBlogPages } from "@/lib/cms/revalidate-site";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdminUser } from "@/lib/map-locations.server";

async function assertAdmin() {
  if (!isSupabaseConfigured()) return true;
  return Boolean(await requireAdminUser());
}

export async function GET() {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await readBlogCategoriesDurable());
}

export async function POST(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as BlogCategory;
  const saved = await saveBlogCategoryDurable(body);
  revalidateBlogPages();
  return NextResponse.json(saved, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  await deleteBlogCategoryDurable(id);
  revalidateBlogPages();
  return NextResponse.json({ ok: true });
}
