import { NextResponse } from "next/server";
import type { CmsBlogPost } from "@/lib/cms/repositories/blog-repository";
import {
  deleteBlogPostDurable,
  readBlogPostsDurable,
  saveBlogPostDurable,
} from "@/lib/cms/server/blog-posts.server";
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
  return NextResponse.json(await readBlogPostsDurable());
}

export async function POST(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as CmsBlogPost;
  const saved = await saveBlogPostDurable(body);
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
  await deleteBlogPostDurable(id);
  return NextResponse.json({ ok: true });
}
