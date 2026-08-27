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
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdminUser } from "@/lib/map-locations.server";

async function assertAdmin() {
  if (!isSupabaseConfigured()) return true;
  return Boolean(await requireAdminUser());
}

export async function GET() {
  return NextResponse.json(await readFaqsDurable());
}

export async function PUT(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    type: "category" | "faq";
    data: CmsFaqCategory | CmsFaqItem;
  };

  if (body.type === "category") {
    const saved = await saveFaqCategoryDurable(body.data as CmsFaqCategory);
    return NextResponse.json(saved);
  }

  if (body.type === "faq") {
    const saved = await saveFaqItemDurable(body.data as CmsFaqItem);
    return NextResponse.json(saved);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function DELETE(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
  }

  if (type === "category") {
    await deleteFaqCategoryDurable(id);
    return NextResponse.json({ ok: true });
  }

  if (type === "faq") {
    await deleteFaqItemDurable(id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
