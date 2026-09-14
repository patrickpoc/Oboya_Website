import { NextResponse } from "next/server";
import {
  deleteFaqCategoryDurable,
  deleteFaqItemDurable,
  readFaqsDurable,
  saveFaqCategoryDurable,
  saveFaqItemDurable,
} from "@/lib/cms/server/faqs.server";
import type {
  CmsFaqCategory,
  CmsFaqItem,
} from "@/lib/cms/repositories/faqs-repository";
import { revalidateFaqPages } from "@/lib/cms/revalidate-site";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";

export async function GET() {
  return NextResponse.json(await readFaqsDurable());
}

export async function PUT(request: Request) {
  const auth = await cmsGuard("website", "edit");
  if ("response" in auth) return auth.response;

  const body = (await request.json()) as {
    type: "category" | "faq";
    data: CmsFaqCategory | CmsFaqItem;
  };

  if (body.type === "category") {
    const saved = await saveFaqCategoryDurable(body.data as CmsFaqCategory);
    revalidateFaqPages();
    return NextResponse.json(saved);
  }

  if (body.type === "faq") {
    const saved = await saveFaqItemDurable(body.data as CmsFaqItem);
    revalidateFaqPages();
    return NextResponse.json(saved);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const auth = await cmsGuard("website", "delete");
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
  }

  if (type === "category") {
    await deleteFaqCategoryDurable(id);
    revalidateFaqPages();
    return NextResponse.json({ ok: true });
  }

  if (type === "faq") {
    await deleteFaqItemDurable(id);
    revalidateFaqPages();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
