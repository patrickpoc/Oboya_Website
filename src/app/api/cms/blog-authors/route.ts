import { NextResponse } from "next/server";
import type { BlogAuthor } from "@/lib/cms/repositories/blog-authors-repository";
import {
  deleteBlogAuthorDurable,
  readBlogAuthorsDurable,
  saveBlogAuthorDurable,
} from "@/lib/cms/server/blog-authors.server";
import { revalidateBlogPages } from "@/lib/cms/revalidate-site";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";

export async function GET() {
  const auth = await cmsGuard("blog", "view");
  if ("response" in auth) return auth.response;
  return NextResponse.json(await readBlogAuthorsDurable());
}

export async function POST(request: Request) {
  const auth = await cmsGuard("blog", "edit");
  if ("response" in auth) return auth.response;
  const body = (await request.json()) as BlogAuthor;
  const saved = await saveBlogAuthorDurable(body);
  revalidateBlogPages();
  return NextResponse.json(saved, { status: 201 });
}

export async function DELETE(request: Request) {
  const auth = await cmsGuard("blog", "delete");
  if ("response" in auth) return auth.response;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  await deleteBlogAuthorDurable(id);
  revalidateBlogPages();
  return NextResponse.json({ ok: true });
}
