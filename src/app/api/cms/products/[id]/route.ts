import { NextResponse } from "next/server";
import {
  getCmsProducts,
  hardDeleteCmsProduct,
  restoreCmsProduct,
  saveCmsProduct,
  softDeleteCmsProduct,
  type CmsProduct,
} from "@/lib/cms/repositories/product-repository";
import {
  hardDeleteProduct,
  persistProductsToFile,
  readProductById,
  restoreProduct,
  saveProduct,
  softDeleteProduct,
} from "@/lib/cms/server/products.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdminUser } from "@/lib/map-locations.server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await readProductById(id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (isSupabaseConfigured()) {
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { id } = await params;
  const body = (await request.json()) as CmsProduct;
  if (body.id !== id) {
    return NextResponse.json({ error: "ID mismatch" }, { status: 400 });
  }
  const saved = saveCmsProduct(body);

  if (isSupabaseConfigured()) {
    await saveProduct(saved);
  }

  await persistProductsToFile(getCmsProducts({ includeDeleted: true }));
  return NextResponse.json(saved);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (isSupabaseConfigured()) {
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { id } = await params;
  const hardDelete = new URL(_request.url).searchParams.get("hard") === "1";
  if (hardDelete) {
    hardDeleteCmsProduct(id);
  } else {
    softDeleteCmsProduct(id);
  }

  if (isSupabaseConfigured()) {
    if (hardDelete) await hardDeleteProduct(id);
    else await softDeleteProduct(id);
  }

  await persistProductsToFile(getCmsProducts({ includeDeleted: true }));
  return NextResponse.json({ ok: true });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (isSupabaseConfigured()) {
    const user = await requireAdminUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { id } = await params;
  const action = new URL(_request.url).searchParams.get("action");

  if (action !== "restore") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  restoreCmsProduct(id);
  if (isSupabaseConfigured()) {
    await restoreProduct(id);
  }
  await persistProductsToFile(getCmsProducts({ includeDeleted: true }));
  return NextResponse.json({ ok: true });
}
