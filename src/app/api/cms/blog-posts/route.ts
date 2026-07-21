import { NextResponse } from "next/server";
import {
  getBlogPosts,
  saveBlogPost,
  deleteBlogPost,
  type CmsBlogPost,
} from "@/lib/cms/repositories/blog-repository";

export async function GET() {
  return NextResponse.json(getBlogPosts());
}

export async function POST(request: Request) {
  const body = (await request.json()) as CmsBlogPost;
  const saved = saveBlogPost(body);
  return NextResponse.json(saved, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  deleteBlogPost(id);
  return NextResponse.json({ ok: true });
}
