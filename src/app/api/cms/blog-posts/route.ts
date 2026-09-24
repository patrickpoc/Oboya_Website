import { NextResponse } from "next/server";
import type { CmsBlogPost } from "@/lib/cms/repositories/blog-repository";
import {
  deleteBlogPostDurable,
  readBlogPostsDurable,
  saveBlogPostDurable,
} from "@/lib/cms/server/blog-posts.server";
import { revalidateBlogPages } from "@/lib/cms/revalidate-site";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";
import type { LocalizedString } from "@/lib/cms/types";

const EMPTY_LOCALIZED: LocalizedString = {
  en: "",
  "pt-BR": "",
  es: "",
  "zh-CN": "",
};

function toListPost(post: CmsBlogPost): CmsBlogPost {
  return {
    ...post,
    body: EMPTY_LOCALIZED,
  };
}

export async function GET(request: Request) {
  const auth = await cmsGuard("blog", "view");
  if ("response" in auth) return auth.response;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const fields = url.searchParams.get("fields");
  const posts = await readBlogPostsDurable();

  if (id) {
    const post = posts.find((item) => item.id === id);
    if (!post) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(post);
  }

  if (fields === "list") {
    return NextResponse.json(posts.map(toListPost));
  }

  return NextResponse.json(posts);
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
