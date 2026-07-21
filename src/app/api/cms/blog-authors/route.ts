import { NextResponse } from "next/server";
import {
  getBlogAuthors,
  saveBlogAuthor,
  deleteBlogAuthor,
  type BlogAuthor,
} from "@/lib/cms/repositories/blog-authors-repository";

export async function GET() {
  return NextResponse.json(getBlogAuthors());
}

export async function POST(request: Request) {
  const body = (await request.json()) as BlogAuthor;
  const saved = saveBlogAuthor(body);
  return NextResponse.json(saved, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  deleteBlogAuthor(id);
  return NextResponse.json({ ok: true });
}
