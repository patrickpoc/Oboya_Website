import { NextResponse } from "next/server";
import type { CmsBlogPost } from "@/lib/cms/repositories/blog-repository";
import {
  deleteBlogPostDurable,
  readBlogPostsDurable,
  saveBlogPostDurable,
} from "@/lib/cms/server/blog-posts.server";
import { revalidateBlogPages } from "@/lib/cms/revalidate-site";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";

export async function GET() {
  const auth = await cmsGuard("blog", "view");
  if ("response" in auth) return auth.response;
  return NextResponse.json(await readBlogPostsDurable());
}

export async function POST(request: Request) {
  const auth = await cmsGuard("blog", "edit");
  if ("response" in auth) return auth.response;
  const body = (await request.json()) as CmsBlogPost;
  const saved = await saveBlogPostDurable(body);
  revalidateBlogPages(saved.slug);
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
  const existing = (await readBlogPostsDurable()).find((post) => post.id === id);
  await deleteBlogPostDurable(id);
  revalidateBlogPages(existing?.slug);
  return NextResponse.json({ ok: true });
}
