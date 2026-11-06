import { NextResponse } from "next/server";
import { withApprovalErrors } from "@/lib/cms/server/approvals.server";
import type { BlogCategory } from "@/lib/cms/repositories/blog-categories-repository";
import {
  deleteBlogCategoryDurable,
  readBlogCategoriesStrict,
  saveBlogCategoryDurable,
} from "@/lib/cms/server/blog-categories.server";
import { revalidateBlogPages } from "@/lib/cms/revalidate-site";
import { cmsGuard } from "@/lib/cms/server/require-cms-auth";

async function handleGET() {
  const auth = await cmsGuard("blog", "view");
  if ("response" in auth) return auth.response;
  return NextResponse.json(await readBlogCategoriesStrict());
}

async function handlePOST(request: Request) {
  const auth = await cmsGuard("blog", "edit");
  if ("response" in auth) return auth.response;
  const body = (await request.json()) as BlogCategory;
  const saved = await saveBlogCategoryDurable(body);
  revalidateBlogPages();
  return NextResponse.json(saved, { status: 201 });
}

async function handleDELETE(request: Request) {
  const auth = await cmsGuard("blog", "delete");
  if ("response" in auth) return auth.response;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  await deleteBlogCategoryDurable(id);
  revalidateBlogPages();
  return NextResponse.json({ ok: true });
}

export const GET = withApprovalErrors("Failed to load categories", handleGET);

export const POST = withApprovalErrors("Failed to save category", handlePOST);

export const DELETE = withApprovalErrors("Failed to delete category", handleDELETE);
