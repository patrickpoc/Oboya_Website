import { NextResponse } from "next/server";
import {
  getCategories,
  getFaqs,
  saveCategory,
  saveFaq,
  deleteCategory,
  deleteFaq,
  type CmsFaqCategory,
  type CmsFaqItem,
} from "@/lib/cms/repositories/faqs-repository";

export async function GET() {
  return NextResponse.json({
    categories: getCategories(),
    faqs: getFaqs(),
  });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    type: "category" | "faq";
    data: CmsFaqCategory | CmsFaqItem;
  };

  if (body.type === "category") {
    const saved = saveCategory(body.data as CmsFaqCategory);
    return NextResponse.json(saved);
  }

  if (body.type === "faq") {
    const saved = saveFaq(body.data as CmsFaqItem);
    return NextResponse.json(saved);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
  }

  if (type === "category") {
    deleteCategory(id);
    return NextResponse.json({ ok: true });
  }

  if (type === "faq") {
    deleteFaq(id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
