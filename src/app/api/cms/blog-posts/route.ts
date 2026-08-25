import { NextResponse } from "next/server";
import type { CmsBlogPost } from "@/lib/cms/repositories/blog-repository";
import { unauthorizedIfNeeded } from "@/lib/cms/server/cms-auth.server";
import { revalidatePublicSite } from "@/lib/cms/server/cms-revalidate.server";
import {
  deleteBlogDurable,
  readBlogDurable,
  saveBlogDurable,
} from "@/lib/cms/server/content.server";

export async function GET() {
  return NextResponse.json(await readBlogDurable());
}

export async function POST(request: Request) {
  const denied = await unauthorizedIfNeeded();
  if (denied) return denied;

  try {
    const body = (await request.json()) as CmsBlogPost;
    const saved = await saveBlogDurable(body);
    revalidatePublicSite(["/blog", "/news"]);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("Failed to save blog post:", error);
    return NextResponse.json(
      { error: "Failed to save blog post" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const denied = await unauthorizedIfNeeded();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  await deleteBlogDurable(id);
  revalidatePublicSite(["/blog", "/news"]);
  return NextResponse.json({ ok: true });
}
