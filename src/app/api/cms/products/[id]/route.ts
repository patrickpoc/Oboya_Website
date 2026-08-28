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
  persistProductsToFileSafe,
  readProductById,
  restoreProduct,
  saveProduct,
  softDeleteProduct,
} from "@/lib/cms/server/products.server";
import { persistProductWithContent } from "@/lib/cms/server/product-content.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireAdminUser } from "@/lib/map-locations.server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await readProductById(id);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load product",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const previous = await readProductById(id);
    const saved = saveCmsProduct(await persistProductWithContent(body, previous));

    if (isSupabaseConfigured()) {
      await saveProduct(saved);
    }

    await persistProductsToFileSafe(getCmsProducts({ includeDeleted: true }));
    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to persist product";
    const status = /exceeds|too many images/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    await persistProductsToFileSafe(getCmsProducts({ includeDeleted: true }));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete product",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    await persistProductsToFileSafe(getCmsProducts({ includeDeleted: true }));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to restore product",
      },
      { status: 500 }
    );
  }
}
