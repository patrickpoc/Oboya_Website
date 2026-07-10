import { NextResponse } from "next/server";
import {
  getBlogCategories,
  saveBlogCategory,
  deleteBlogCategory,
  type BlogCategory,
} from "@/lib/cms/repositories/blog-categories-repository";

export async function GET() {
  return NextResponse.json(getBlogCategories());
}

export async function POST(request: Request) {
  const body = (await request.json()) as BlogCategory;
  const saved = saveBlogCategory(body);
  return NextResponse.json(saved, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  deleteBlogCategory(id);
  return NextResponse.json({ ok: true });
}
