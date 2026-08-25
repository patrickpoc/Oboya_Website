import { NextResponse } from "next/server";
import type {
  CmsFaqCategory,
  CmsFaqItem,
} from "@/lib/cms/repositories/faqs-repository";
import { unauthorizedIfNeeded } from "@/lib/cms/server/cms-auth.server";
import { revalidatePublicSite } from "@/lib/cms/server/cms-revalidate.server";
import {
  deleteFaqCategoryDurable,
  deleteFaqItemDurable,
  readFaqsDurable,
  saveFaqCategoryDurable,
  saveFaqItemDurable,
} from "@/lib/cms/server/content.server";

export async function GET() {
  return NextResponse.json(await readFaqsDurable());
}

export async function PUT(request: Request) {
  const denied = await unauthorizedIfNeeded();
  if (denied) return denied;

  try {
    const body = (await request.json()) as {
      type: "category" | "faq";
      data: CmsFaqCategory | CmsFaqItem;
    };

    if (body.type === "category") {
      const saved = await saveFaqCategoryDurable(body.data as CmsFaqCategory);
      revalidatePublicSite(["/faqs"]);
      return NextResponse.json(saved);
    }

    if (body.type === "faq") {
      const saved = await saveFaqItemDurable(body.data as CmsFaqItem);
      revalidatePublicSite(["/faqs"]);
      return NextResponse.json(saved);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Failed to save FAQ:", error);
    return NextResponse.json({ error: "Failed to save FAQ" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await unauthorizedIfNeeded();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
  }

  if (type === "category") {
    await deleteFaqCategoryDurable(id);
    revalidatePublicSite(["/faqs"]);
    return NextResponse.json({ ok: true });
  }

  if (type === "faq") {
    await deleteFaqItemDurable(id);
    revalidatePublicSite(["/faqs"]);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
